import type { User } from "@supabase/supabase-js"
import {
  gatewayProfileSchema,
  type GatewayProfileConfig,
} from "@/lib/connectors/schemas"
import { computeMetricSnapshots } from "@/lib/analytics/metrics"
import { gatewayProfileCatalog as gatewayProfiles } from "@/lib/gateway/catalog"
import { getGatewayProvider } from "@/lib/gateway/registry"
import { hasMinimumGatewayCapabilities } from "@/lib/gateway/capabilities"
import { createSyncRun, finishSyncRun, getRuntimeState, replaceMetricSnapshots, upsertRawEvents } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import {
  computeAndPersistMetrics,
  createPersistedSyncRun,
  ensureGatewayDataSource,
  finishPersistedSyncRun,
  listPersistedGatewayProfilesForUser,
  loadGatewaySecret,
  loadPersistedGatewayProfileForUser,
  recordGatewayCapabilityChecks,
  recordGatewayToolRun,
  saveGatewayProfile,
  updateGatewayProfileStatus,
  upsertPersistedRawEvents,
  type SaveGatewayInput,
} from "@/lib/persistence/supabase"
import type { GatewayProfile } from "@/lib/mock/types"

function profileFromMock(id: string): GatewayProfileConfig | null {
  if (process.env.NODE_ENV === "production") return null

  if (id === "gw_mock") {
    return gatewayProfileSchema.parse({
      id: "gw_mock",
      provider: "mock_gateway",
      name: "Gateway mock interne",
      transport: "http",
      mode: "read_only",
      endpoint: "mock://ci",
      capabilities: ["schema.inspect", "events.read", "entities.read", "metrics.read", "funnels.compute", "health.check"],
      scopes: ["project:read", "events:read", "metrics:read"],
    })
  }
  const profile = gatewayProfiles.find((item) => item.id === id)
  if (!profile) return null
  return gatewayProfileSchema.parse(profile)
}

export async function testGatewayConnection(id: string, input?: Partial<GatewayProfileConfig> & { token?: string }) {
  const profile = input?.provider
    ? gatewayProfileSchema.parse({
        id,
        provider: input.provider,
        name: input.name ?? id,
        transport: input.transport ?? "http",
        mode: "read_only",
        endpoint: input.endpoint ?? "mock://local",
        capabilities: input.capabilities ?? [],
        scopes: input.scopes ?? ["project:read", "events:read", "metrics:read"],
      })
    : profileFromMock(id)

  if (!profile) {
    return { ok: false, status: "blocked" as const, latencyMs: 0, message: "Profil Gateway inconnu.", capabilities: [], forbiddenCapabilities: [] }
  }
  if (process.env.NODE_ENV === "production" && profile.provider === "mock_gateway") {
    return {
      ok: false,
      status: "blocked" as const,
      latencyMs: 0,
      message: "Gateway mock désactivé en production.",
      capabilities: [],
      forbiddenCapabilities: [],
    }
  }

  const result = await getGatewayProvider(profile.provider).testConnection({ profile, token: input?.token })
  return {
    ...result,
    ok: result.ok && hasMinimumGatewayCapabilities(result.capabilities),
  }
}

function toGatewayConfig(profile: GatewayProfile): GatewayProfileConfig {
  return gatewayProfileSchema.parse({
    id: profile.id,
    provider: profile.provider,
    name: profile.name,
    transport: profile.transport,
    mode: "read_only",
    endpoint: profile.endpoint,
    capabilities: profile.capabilities,
    scopes: profile.scopes,
  })
}

export async function listGatewayProfilesForUser(user?: User) {
  if (user && isSupabaseServerConfigured()) return listPersistedGatewayProfilesForUser(user)
  return gatewayProfiles
}

export async function loadGatewayProfileForUser(id: string, user?: User) {
  if (user && isSupabaseServerConfigured()) {
    const result = await loadPersistedGatewayProfileForUser(user, id)
    return result?.profile ?? null
  }
  return gatewayProfiles.find((profile) => profile.id === id) ?? null
}

async function loadGatewayRef(id: string, user?: User) {
  if (user && isSupabaseServerConfigured()) {
    const persisted = await loadPersistedGatewayProfileForUser(user, id)
    if (!persisted) return null
    const secret = await loadGatewaySecret(id)
    return {
      context: persisted.context,
      profile: toGatewayConfig(persisted.profile),
      publicProfile: persisted.profile,
      token: secret?.token,
    }
  }

  const profile = profileFromMock(id)
  if (!profile) return null
  return { context: null, profile, publicProfile: null, token: undefined }
}

export async function saveAndTestGatewayProfile(input: SaveGatewayInput) {
  const profile = gatewayProfileSchema.parse({
    id: "pending",
    provider: input.provider,
    name: input.name,
    transport: input.transport,
    mode: "read_only",
    endpoint: input.endpoint,
    capabilities: [],
    scopes: input.scopes ?? ["project:read", "events:read", "metrics:read"],
  })
  const health = await getGatewayProvider(input.provider).testConnection({ profile, token: input.token })
  if (!health.ok || !hasMinimumGatewayCapabilities(health.capabilities)) {
    return {
      ok: false,
      health: {
        ...health,
        ok: false,
      },
      profile: null,
    }
  }

  const saved = await saveGatewayProfile({
    ...input,
    capabilities: health.capabilities,
    scopes: input.scopes ?? ["project:read", "events:read", "metrics:read"],
  })
  await recordGatewayCapabilityChecks({
    context: saved.context,
    gatewayProfileId: saved.profile.id,
    capabilities: health.capabilities,
    latencyMs: health.latencyMs,
    message: health.message,
  })
  return {
    ok: true,
    health,
    profile: saved.profile,
  }
}

export async function testPersistedGatewayConnection(
  id: string,
  user: User,
  input?: Partial<GatewayProfileConfig> & { token?: string },
) {
  if (input?.provider) return testGatewayConnection(id, input)

  const ref = await loadGatewayRef(id, user)
  if (!ref) {
    return { ok: false, status: "blocked" as const, latencyMs: 0, message: "Profil Gateway inconnu.", capabilities: [], forbiddenCapabilities: [] }
  }

  const result = await getGatewayProvider(ref.profile.provider).testConnection({ profile: ref.profile, token: ref.token })
  const ok = result.ok && hasMinimumGatewayCapabilities(result.capabilities)
  if (ref.context) {
    await updateGatewayProfileStatus({
      gatewayProfileId: id,
      status: ok ? "connected" : "error",
      capabilities: result.capabilities,
      lastHealthCheckAt: new Date().toISOString(),
    })
    await recordGatewayCapabilityChecks({
      context: ref.context,
      gatewayProfileId: id,
      capabilities: result.capabilities,
      latencyMs: result.latencyMs,
      message: result.message,
    })
  }
  return { ...result, ok }
}

export async function inspectGatewaySchema(id: string, user?: User) {
  const ref = await loadGatewayRef(id, user)
  if (!ref) throw new Error("Unknown gateway profile")
  const started = Date.now()
  try {
    const schema = await getGatewayProvider(ref.profile.provider).inspectSchema({ profile: ref.profile, token: ref.token })
    if (ref.context) {
      await recordGatewayToolRun({
        context: ref.context,
        gatewayProfileId: id,
        capability: "schema.inspect",
        operation: "inspect_schema",
        recordsRead: schema.objects.length,
        status: "success",
        latencyMs: Date.now() - started,
      })
    }
    return schema
  } catch (error) {
    if (ref.context) {
      await recordGatewayToolRun({
        context: ref.context,
        gatewayProfileId: id,
        capability: "schema.inspect",
        operation: "inspect_schema",
        status: "error",
        latencyMs: Date.now() - started,
        errorCode: "gateway_schema_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown gateway error",
      })
    }
    throw error
  }
}

export async function syncGatewayEvents(id: string, user?: User) {
  if (user && isSupabaseServerConfigured()) {
    const ref = await loadGatewayRef(id, user)
    if (!ref?.context || !ref.publicProfile) throw new Error("Unknown gateway profile")
    const dataSourceId = await ensureGatewayDataSource({
      context: ref.context,
      userId: user.id,
      profile: ref.publicProfile,
    })
    const run = await createPersistedSyncRun(ref.context, dataSourceId, "gateway")
    const started = Date.now()
    try {
      const events = await getGatewayProvider(ref.profile.provider).readEvents({ profile: ref.profile, token: ref.token, limit: 5000 })
      const result = await upsertPersistedRawEvents({
        context: ref.context,
        dataSourceId,
        syncRunId: run.id,
        events,
      })
      await computeAndPersistMetrics({
        context: ref.context,
        dataSourceId,
        syncRunId: run.id,
        sourceLabel: ref.profile.name,
      })
      await recordGatewayToolRun({
        context: ref.context,
        gatewayProfileId: id,
        capability: "events.read",
        operation: "read_events_since",
        recordsRead: events.length,
        status: "success",
        latencyMs: Date.now() - started,
      })
      return finishPersistedSyncRun(run.id, {
        status: "success",
        recordsRead: events.length,
        recordsInserted: result.insertedCount,
        recordsDeduplicated: result.deduplicatedCount,
        cursorAfter: new Date().toISOString(),
      })
    } catch (error) {
      await recordGatewayToolRun({
        context: ref.context,
        gatewayProfileId: id,
        capability: "events.read",
        operation: "read_events_since",
        status: "error",
        latencyMs: Date.now() - started,
        errorCode: "gateway_sync_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown gateway error",
      })
      return finishPersistedSyncRun(run.id, {
        status: "error",
        errorCode: "gateway_sync_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown gateway error",
      })
    }
  }

  const profile = profileFromMock(id)
  if (!profile) throw new Error("Unknown gateway profile")

  const run = createSyncRun({ dataSourceId: id, syncType: "gateway" })
  try {
    const events = await getGatewayProvider(profile.provider).readEvents({ profile, limit: 5000 })
    const result = upsertRawEvents(id, events)
    const metrics = computeMetricSnapshots(getRuntimeState().rawEvents, id)
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
      errorCode: "gateway_sync_failed",
      errorMessage: error instanceof Error ? error.message : "Unknown gateway error",
    })
  }
}
