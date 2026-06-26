import { getSampleFixtureEvents } from "@/lib/connectors/fixtures/sample-events"
import { computeMetricSnapshots } from "@/lib/analytics/metrics"
import { MINIMUM_GATEWAY_CAPABILITIES, OPTIONAL_GATEWAY_CAPABILITIES } from "@/lib/gateway/capabilities"
import type { GatewayProvider } from "@/lib/gateway/types"

export class MockGatewayProvider implements GatewayProvider {
  async testConnection() {
    return {
      ok: true,
      status: "healthy" as const,
      latencyMs: 18,
      message: "Gateway mock disponible en lecture seule.",
      capabilities: [...MINIMUM_GATEWAY_CAPABILITIES, "funnels.compute" as const],
      forbiddenCapabilities: [],
    }
  }

  async listCapabilities() {
    return [...MINIMUM_GATEWAY_CAPABILITIES, ...OPTIONAL_GATEWAY_CAPABILITIES.slice(0, 1)]
  }

  async inspectSchema() {
    return {
      sourceId: "gw_mock",
      objects: [
        {
          name: "events",
          kind: "stream" as const,
          sampleSize: 100,
          fields: [
            { name: "eventName", type: "string", nullable: false },
            { name: "occurredAt", type: "datetime", nullable: false },
            { name: "actorId", type: "string", nullable: false },
            { name: "entityId", type: "string", nullable: false },
            { name: "properties", type: "json", nullable: false },
          ],
        },
        {
          name: "sample_projects",
          kind: "collection" as const,
          sampleSize: 100,
          fields: [
            { name: "id", type: "string", nullable: false },
            { name: "eventType", type: "string", nullable: false },
            { name: "createdAt", type: "datetime", nullable: false },
          ],
        },
      ],
    }
  }

  async readEvents(input: { limit?: number }) {
    return getSampleFixtureEvents().slice(0, input.limit ?? 5000)
  }

  async readEntities(input: { limit?: number }) {
    return getSampleFixtureEvents()
      .filter((event) => event.eventName === "sample_project_created")
      .slice(0, input.limit ?? 1000)
      .map((event) => ({
        id: event.entityId,
        type: event.properties.eventType,
        createdAt: event.occurredAt,
      }))
  }

  async readMetrics() {
    const events = getSampleFixtureEvents().map((event) => ({
      ...event,
      canonicalEventName: null,
      dataSourceId: "gw_mock",
      hash: event.externalId,
      receivedAt: event.occurredAt,
    }))
    return computeMetricSnapshots(events, "gw_mock")
  }
}
