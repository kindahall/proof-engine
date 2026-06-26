import { createHash, randomUUID } from "node:crypto"
import type { MetricSnapshot, NormalizedEvent, SourceEvent } from "@/lib/connectors/schemas"
import { mapSourceEvent } from "@/lib/connectors/mapping"

export type RuntimeSyncStatus = "success" | "error" | "running"

export interface RuntimeSyncRun {
  id: string
  dataSourceId: string
  status: RuntimeSyncStatus
  syncType: "initial" | "incremental" | "manual" | "gateway"
  startedAt: string
  finishedAt: string | null
  cursorBefore: string | null
  cursorAfter: string | null
  recordsRead: number
  recordsInserted: number
  recordsDeduplicated: number
  errorCode: string | null
  errorMessage: string | null
}

export interface RuntimeState {
  rawEvents: NormalizedEvent[]
  syncRuns: RuntimeSyncRun[]
  metricSnapshots: MetricSnapshot[]
}

const globalStore = globalThis as typeof globalThis & { __proofEngineRuntime?: RuntimeState }

function initialState(): RuntimeState {
  return {
    rawEvents: [],
    syncRuns: [],
    metricSnapshots: [],
  }
}

export function getRuntimeState() {
  globalStore.__proofEngineRuntime ??= initialState()
  return globalStore.__proofEngineRuntime
}

export function resetRuntimeState() {
  globalStore.__proofEngineRuntime = initialState()
  return globalStore.__proofEngineRuntime
}

export function hashSourceEvent(dataSourceId: string, event: SourceEvent) {
  return createHash("sha256")
    .update(`${dataSourceId}:${event.externalId}:${event.eventName}:${event.occurredAt}:${event.entityId}`)
    .digest("hex")
}

export function normalizeSourceEvent(dataSourceId: string, event: SourceEvent): NormalizedEvent {
  const hash = hashSourceEvent(dataSourceId, event)
  return {
    ...event,
    canonicalEventName: mapSourceEvent(event.eventName),
    dataSourceId,
    hash,
    receivedAt: new Date().toISOString(),
  }
}

export function upsertRawEvents(dataSourceId: string, events: SourceEvent[]) {
  const state = getRuntimeState()
  const existing = new Set(state.rawEvents.map((event) => event.hash))
  const normalized = events.map((event) => normalizeSourceEvent(dataSourceId, event))
  const inserted = normalized.filter((event) => !existing.has(event.hash))
  state.rawEvents.push(...inserted)

  return {
    inserted,
    insertedCount: inserted.length,
    deduplicatedCount: normalized.length - inserted.length,
  }
}

export function createSyncRun(input: Pick<RuntimeSyncRun, "dataSourceId" | "syncType">): RuntimeSyncRun {
  const run: RuntimeSyncRun = {
    id: randomUUID(),
    dataSourceId: input.dataSourceId,
    syncType: input.syncType,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    cursorBefore: null,
    cursorAfter: null,
    recordsRead: 0,
    recordsInserted: 0,
    recordsDeduplicated: 0,
    errorCode: null,
    errorMessage: null,
  }
  getRuntimeState().syncRuns.unshift(run)
  return run
}

export function finishSyncRun(runId: string, patch: Partial<RuntimeSyncRun>) {
  const state = getRuntimeState()
  const run = state.syncRuns.find((item) => item.id === runId)
  if (!run) throw new Error(`Unknown sync run: ${runId}`)
  Object.assign(run, patch, { finishedAt: new Date().toISOString() })
  return run
}

export function replaceMetricSnapshots(metrics: MetricSnapshot[]) {
  const state = getRuntimeState()
  state.metricSnapshots = metrics
  return state.metricSnapshots
}
