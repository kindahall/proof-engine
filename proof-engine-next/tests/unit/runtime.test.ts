import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { computeFunnelSnapshot, evaluateDataQualityGate, generateEvidenceFromMetrics } from "@/lib/analytics/metrics"
import { sampleEventMappings, validateMappingCoverage } from "@/lib/connectors/mapping"
import { getSampleFixtureEvents } from "@/lib/connectors/fixtures/sample-events"
import { ingestConnectorEvents, syncConnector, testConnector } from "@/lib/connectors/service"
import { getRuntimeState, resetRuntimeState } from "@/lib/runtime/store"
import { runDiagnosticFromRuntime } from "@/lib/diagnostics/service"

describe("runtime synchronization", () => {
  beforeEach(() => resetRuntimeState())
  afterEach(() => vi.unstubAllEnvs())

  it("synchronizes mock events and deduplicates repeat syncs", async () => {
    const first = await syncConnector("ds_mock", "initial")
    const second = await syncConnector("ds_mock", "incremental")

    expect(first.status).toBe("success")
    expect(first.recordsInserted).toBeGreaterThan(0)
    expect(second.recordsInserted).toBe(0)
    expect(second.recordsDeduplicated).toBe(first.recordsRead)
  })

  it("blocks the internal mock connector in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const health = await testConnector("ds_mock")
    const run = await syncConnector("ds_mock", "manual")

    expect(health.ok).toBe(false)
    expect(health.status).toBe("blocked")
    expect(run.status).toBe("error")
    expect(run.errorCode).toBe("mock_connector_disabled")
    expect(getRuntimeState().rawEvents).toHaveLength(0)
  })

  it("does not synthesize fixture events for a real connector without persistence", async () => {
    const run = await syncConnector("ds_postgres", "manual")

    expect(run.status).toBe("error")
    expect(run.errorCode).toBe("connector_persistence_required")
    expect(getRuntimeState().rawEvents).toHaveLength(0)
  })

  it("ingests signed webhook events into the local runtime fallback", async () => {
    const event = {
      eventName: "guest_joined",
      occurredAt: "2026-06-24T10:00:00.000Z",
      actorId: "guest_test",
      actorType: "guest" as const,
      entityId: "event_test",
      entityType: "sample_project",
      properties: {},
    }

    const first = await ingestConnectorEvents("ds_webhook", [event])
    const second = await ingestConnectorEvents("ds_webhook", [event])

    expect(first.insertedCount).toBe(1)
    expect(second.insertedCount).toBe(0)
    expect(second.deduplicatedCount).toBe(1)
    expect(getRuntimeState().rawEvents).toHaveLength(1)
  })

  it("computes funnel, metrics, evidence and a sufficient diagnostic", async () => {
    await syncConnector("ds_mock", "initial")
    const state = getRuntimeState()
    const funnel = computeFunnelSnapshot(state.rawEvents)
    const evidence = generateEvidenceFromMetrics(state.rawEvents, state.metricSnapshots)
    const diagnostic = await runDiagnosticFromRuntime()

    expect(funnel[0].count).toBe(100)
    expect(state.metricSnapshots.find((metric) => metric.key === "share_rate")?.value).toBe(42)
    expect(evidence.some((item) => item.classification === "fact")).toBe(true)
    expect(diagnostic.gate.status).toBe("passed")
    expect(diagnostic.diagnostic.bottleneck.type).toBe("activation")
  })

  it("blocks diagnostics when no source has synced", () => {
    const state = getRuntimeState()
    const gate = evaluateDataQualityGate({
      connectedSources: 0,
      lastSuccessfulSyncAt: null,
      activeMappings: sampleEventMappings.length,
      events: state.rawEvents,
      metrics: state.metricSnapshots,
    })

    expect(gate.status).toBe("blocked")
  })

  it("validates sample mapping coverage", () => {
    const coverage = validateMappingCoverage(getSampleFixtureEvents())
    expect(coverage.unmapped).toEqual([])
    expect(coverage.score).toBe(100)
  })
})
