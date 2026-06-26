import { createHash } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import { computeMetricSnapshots } from "@/lib/analytics/metrics"
import { connectorCatalog as connectors } from "@/lib/connectors/catalog"
import { sourceEventSchema, type SourceEvent } from "@/lib/connectors/schemas"
import { MockConnectorProvider } from "@/lib/connectors/providers/mock"
import { PostgresReadOnlyConnectorProvider } from "@/lib/connectors/providers/postgres"
import { RestApiConnectorProvider } from "@/lib/connectors/providers/rest-api"
import { FirebaseReadOnlyConnectorProvider } from "@/lib/connectors/providers/firebase"
import { StripeReadOnlyConnectorProvider } from "@/lib/connectors/providers/stripe"
import { createSyncRun, finishSyncRun, getRuntimeState, replaceMetricSnapshots, upsertRawEvents } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import {
  computeAndPersistMetrics,
  createPersistedSyncRun,
  finishPersistedSyncRun,
  loadActivePersistedConnectors,
  loadConnectorForUser,
  loadConnectorSecret,
  recordConnectorHealth,
  updateConnectorStatus,
  upsertPersistedRawEvents,
  type LoadedPersistedConnector,
  type PersistedConnector,
} from "@/lib/persistence/supabase"
import { toSupabaseOperationalError } from "@/lib/supabase/errors"

type ConnectorProviderInstance = {
  testConnection: () => Promise<{ ok: boolean; status: "healthy" | "degraded" | "blocked"; latencyMs: number; message: string }>
  readEvents?: () => Promise<SourceEvent[]>
}

export class WebhookIngestionNotConfiguredError extends Error {
  constructor() {
    super("Aucun connecteur webhook actif n'est configuré pour persister ces événements.")
    this.name = "WebhookIngestionNotConfiguredError"
  }
}

function mocksAllowed() {
  return process.env.NODE_ENV !== "production"
}

function mockConnectorDisabledResult() {
  return {
    ok: false,
    status: "blocked" as const,
    latencyMs: 0,
    message: "Connecteur mock désactivé en production.",
  }
}

function buildPersistedProvider(connector: PersistedConnector, secret: Awaited<ReturnType<typeof loadConnectorSecret>>): ConnectorProviderInstance {
  if (!secret) throw new Error("Secret de connecteur introuvable.")

  if (connector.provider === "postgres" || connector.provider === "supabase_postgres") {
    if (!secret.connectionString) throw new Error("Chaîne de connexion PostgreSQL manquante.")
    const eventsTable = typeof connector.config.eventsTable === "string" ? connector.config.eventsTable : "events"
    return new PostgresReadOnlyConnectorProvider(secret.connectionString, eventsTable)
  }

  if (connector.provider === "rest_api") {
    const endpoint = secret.endpoint ?? (typeof connector.config.endpoint === "string" ? connector.config.endpoint : "")
    if (!endpoint) throw new Error("Endpoint REST manquant.")
    return new RestApiConnectorProvider(endpoint, secret.token)
  }

  if (connector.provider === "firebase_firestore") {
    if (!secret.serviceAccountJson) throw new Error("Service account Firebase manquant.")
    const collectionName = typeof connector.config.eventsCollection === "string" ? connector.config.eventsCollection : "events"
    return new FirebaseReadOnlyConnectorProvider(secret.serviceAccountJson, collectionName)
  }

  if (connector.provider === "stripe_readonly") {
    if (!secret.token) throw new Error("Clé Stripe restreinte manquante.")
    return new StripeReadOnlyConnectorProvider(secret.token)
  }

  if (connector.provider === "webhook_events") {
    return {
      async testConnection() {
        return {
          ok: Boolean(secret.signingSecret),
          status: secret.signingSecret ? "healthy" : "blocked",
          latencyMs: 0,
          message: secret.signingSecret
            ? "Collecteur webhook prêt à recevoir des événements signés."
            : "Clé de signature webhook manquante.",
        }
      },
    }
  }

  throw new Error(`Provider non supporté: ${connector.provider}`)
}

export async function testConnector(dataSourceId: string, user?: User) {
  if (dataSourceId === "ds_mock") {
    if (!mocksAllowed()) return mockConnectorDisabledResult()
    return new MockConnectorProvider().testConnection()
  }

  if (user && isSupabaseServerConfigured()) {
    const loaded = await loadConnectorForUser(user, dataSourceId)
    if (!loaded) {
      return { ok: false, status: "blocked" as const, latencyMs: 0, message: "Connecteur inconnu." }
    }

    try {
      const provider = buildPersistedProvider(loaded.connector, await loadConnectorSecret(loaded.connector.id))
      const result = await provider.testConnection()
      await recordConnectorHealth({
        context: loaded.context,
        dataSourceId: loaded.connector.id,
        status: result.status,
        latencyMs: result.latencyMs,
        message: result.message,
      })
      await updateConnectorStatus({
        dataSourceId: loaded.connector.id,
        status: result.ok ? "connected" : "error",
        lastError: result.ok ? null : result.message,
      })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connexion impossible."
      await updateConnectorStatus({
        dataSourceId: loaded.connector.id,
        status: "error",
        lastError: message,
      })
      return { ok: false, status: "blocked" as const, latencyMs: 0, message }
    }
  }

  const connector = connectors.find((item) => item.id === dataSourceId)
  if (!connector) {
    return { ok: false, status: "blocked" as const, latencyMs: 0, message: "Connecteur inconnu." }
  }
  if (connector.status === "not_connected") {
    return { ok: false, status: "blocked" as const, latencyMs: 0, message: "Ajoutez les identifiants en lecture seule de la source avant le test." }
  }
  if (connector?.status === "error") {
    return { ok: false, status: "blocked" as const, latencyMs: 0, message: connector.lastError ?? "Connecteur en erreur." }
  }
  return { ok: true, status: "healthy" as const, latencyMs: 0, message: "Connecteur actif." }
}

async function syncPersistedConnector(loaded: LoadedPersistedConnector, syncType: "initial" | "incremental" | "manual") {
  const run = await createPersistedSyncRun(loaded.context, loaded.connector.id, syncType)
  try {
    const provider = buildPersistedProvider(loaded.connector, await loadConnectorSecret(loaded.connector.id))
    if (!provider.readEvents) throw new Error("Ce connecteur ne supporte pas encore la synchronisation d'événements.")

    await updateConnectorStatus({ dataSourceId: loaded.connector.id, status: "syncing", lastError: null })
    const events = await provider.readEvents()
    const result = await upsertPersistedRawEvents({
      context: loaded.context,
      dataSourceId: loaded.connector.id,
      syncRunId: run.id,
      events,
    })
    await computeAndPersistMetrics({
      context: loaded.context,
      dataSourceId: loaded.connector.id,
      syncRunId: run.id,
      sourceLabel: loaded.connector.name,
    })
    const finished = await finishPersistedSyncRun(run.id, {
      status: "success",
      recordsRead: events.length,
      recordsInserted: result.insertedCount,
      recordsDeduplicated: result.deduplicatedCount,
      cursorAfter: new Date().toISOString(),
    })
    await updateConnectorStatus({
      dataSourceId: loaded.connector.id,
      status: "connected",
      lastError: null,
      lastSuccessfulSyncAt: finished.finishedAt,
    })
    return finished
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown connector error"
    const finished = await finishPersistedSyncRun(run.id, {
      status: "error",
      errorCode: "connector_sync_failed",
      errorMessage: message,
    })
    await updateConnectorStatus({
      dataSourceId: loaded.connector.id,
      status: "error",
      lastError: message,
      lastFailedSyncAt: finished.finishedAt,
    })
    return finished
  }
}

export async function syncConnector(dataSourceId: string, syncType: "initial" | "incremental" | "manual" = "manual", user?: User) {
  if (dataSourceId === "ds_mock") {
    const run = createSyncRun({ dataSourceId, syncType })

    if (!mocksAllowed()) {
      return finishSyncRun(run.id, {
        status: "error",
        errorCode: "mock_connector_disabled",
        errorMessage: "Connecteur mock désactivé en production.",
      })
    }

    try {
      const events = await new MockConnectorProvider().readEvents()
      const result = upsertRawEvents(dataSourceId, events)
      const metrics = computeMetricSnapshots(getRuntimeState().rawEvents, dataSourceId)
      replaceMetricSnapshots(metrics)
      return finishSyncRun(run.id, {
        status: "success",
        recordsRead: events.length,
        recordsInserted: result.insertedCount,
        recordsDeduplicated: result.deduplicatedCount,
        cursorAfter: new Date().toISOString(),
      })
    } catch (error) {
      return finishSyncRun(run.id, {
        status: "error",
        errorCode: "connector_sync_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown connector error",
      })
    }
  }

  if (user && isSupabaseServerConfigured()) {
    const loaded = await loadConnectorForUser(user, dataSourceId)
    if (!loaded) {
      return {
        id: "unknown",
        dataSourceId,
        syncType,
        status: "error" as const,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        cursorBefore: null,
        cursorAfter: null,
        recordsRead: 0,
        recordsInserted: 0,
        recordsDeduplicated: 0,
        errorCode: "connector_not_found",
        errorMessage: "Connecteur inconnu.",
      }
    }

    return syncPersistedConnector(loaded, syncType)
  }

  const run = createSyncRun({ dataSourceId, syncType })
  return finishSyncRun(run.id, {
    status: "error",
    errorCode: "connector_persistence_required",
    errorMessage: "Synchronisation réelle indisponible sans session utilisateur et persistance Supabase.",
  })
}

export function ingestConnectorEvent(dataSourceId: string, input: unknown) {
  const parsed = parseIngestedSourceEvent(input)
  return upsertRawEvents(dataSourceId, [parsed])
}

export async function ingestConnectorEvents(dataSourceId: string, inputs: unknown[]) {
  const events = inputs.map(parseIngestedSourceEvent)

  if (isSupabaseServerConfigured()) {
    try {
      const activeWebhook = (await loadActivePersistedConnectors()).find(
        (loaded) =>
          loaded.connector.provider === "webhook_events" &&
          (dataSourceId === "ds_webhook" || loaded.connector.id === dataSourceId),
      )

      if (activeWebhook) {
        const run = await createPersistedSyncRun(activeWebhook.context, activeWebhook.connector.id, "manual")
        try {
          const result = await upsertPersistedRawEvents({
            context: activeWebhook.context,
            dataSourceId: activeWebhook.connector.id,
            syncRunId: run.id,
            events,
          })
          await computeAndPersistMetrics({
            context: activeWebhook.context,
            dataSourceId: activeWebhook.connector.id,
            syncRunId: run.id,
            sourceLabel: activeWebhook.connector.name,
          })
          await finishPersistedSyncRun(run.id, {
            status: "success",
            recordsRead: events.length,
            recordsInserted: result.insertedCount,
            recordsDeduplicated: result.deduplicatedCount,
            cursorAfter: new Date().toISOString(),
          })
          return result
        } catch (error) {
          await finishPersistedSyncRun(run.id, {
            status: "error",
            errorCode: "webhook_ingest_failed",
            errorMessage: error instanceof Error ? error.message : "Webhook ingestion failed.",
          })
          throw error
        }
      }

      if (process.env.NODE_ENV === "production") {
        throw new WebhookIngestionNotConfiguredError()
      }
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !toSupabaseOperationalError(error)) {
        throw error
      }
    }
  }

  return events.reduce(
    (total, event) => {
      const result = ingestConnectorEvent(dataSourceId, event)
      return {
        inserted: [...total.inserted, ...result.inserted],
        insertedCount: total.insertedCount + result.insertedCount,
        deduplicatedCount: total.deduplicatedCount + result.deduplicatedCount,
      }
    },
    { inserted: [] as unknown[], insertedCount: 0, deduplicatedCount: 0 },
  )
}

function parseIngestedSourceEvent(input: unknown) {
  const eventInput = typeof input === "object" && input != null ? input : {}
  return sourceEventSchema.parse({
    externalId: deriveIngestedExternalId(eventInput),
    ...eventInput,
  })
}

function deriveIngestedExternalId(eventInput: object) {
  if ("externalId" in eventInput && typeof eventInput.externalId === "string" && eventInput.externalId.trim()) {
    return eventInput.externalId
  }
  if ("external_id" in eventInput && typeof eventInput.external_id === "string" && eventInput.external_id.trim()) {
    return eventInput.external_id
  }

  const source = JSON.stringify({
    eventName: "eventName" in eventInput ? eventInput.eventName : null,
    occurredAt: "occurredAt" in eventInput ? eventInput.occurredAt : null,
    actorId: "actorId" in eventInput ? eventInput.actorId : null,
    entityId: "entityId" in eventInput ? eventInput.entityId : null,
    entityType: "entityType" in eventInput ? eventInput.entityType : null,
  })
  return `ingest_${createHash("sha256").update(source).digest("hex").slice(0, 32)}`
}

export async function syncAllConnectors() {
  if (isSupabaseServerConfigured()) {
    const active = await loadActivePersistedConnectors()
    const runs = []
    for (const connector of active) {
      runs.push(await syncPersistedConnector(connector, "incremental"))
    }
    return runs
  }

  const active = connectors.filter((connector) => connector.status === "connected")
  const runs = []
  for (const connector of active) {
    runs.push(await syncConnector(connector.id, "incremental"))
  }
  return runs
}

export function parseSourceEvents(payload: unknown): SourceEvent[] {
  return sourceEventSchema.array().parse(Array.isArray(payload) ? payload : [payload])
}
