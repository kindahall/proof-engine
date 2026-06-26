import type {
  GatewayCapability,
  GatewayHealthResult,
  GatewaySchemaResult,
  MetricSnapshot,
  NormalizedEvent,
} from "@/lib/connectors/schemas"
import { MINIMUM_GATEWAY_CAPABILITIES } from "@/lib/gateway/capabilities"

const INTERNAL_GATEWAY_CAPABILITIES = [
  ...MINIMUM_GATEWAY_CAPABILITIES,
  "funnels.compute",
] satisfies GatewayCapability[]

export function buildInternalGatewayHealth(latencyMs = 0): GatewayHealthResult {
  return {
    ok: true,
    status: "healthy",
    latencyMs,
    message: "Gateway Proof Engine interne disponible en lecture seule.",
    capabilities: INTERNAL_GATEWAY_CAPABILITIES,
    forbiddenCapabilities: [],
  }
}

export function buildInternalGatewaySchema(input: {
  events: NormalizedEvent[]
  metrics: MetricSnapshot[]
}): GatewaySchemaResult {
  return {
    sourceId: "proof_engine_internal",
    objects: [
      {
        name: "events",
        kind: "stream",
        sampleSize: input.events.length,
        fields: [
          { name: "externalId", type: "string", nullable: false },
          { name: "eventName", type: "string", nullable: false },
          { name: "canonicalEventName", type: "string", nullable: true },
          { name: "occurredAt", type: "datetime", nullable: false },
          { name: "actorId", type: "string", nullable: false },
          { name: "actorType", type: "string", nullable: false },
          { name: "entityId", type: "string", nullable: false },
          { name: "entityType", type: "string", nullable: false },
          { name: "properties", type: "json", nullable: false },
        ],
      },
      {
        name: "metrics",
        kind: "table",
        sampleSize: input.metrics.length,
        fields: [
          { name: "key", type: "string", nullable: false },
          { name: "name", type: "string", nullable: false },
          { name: "value", type: "number", nullable: false },
          { name: "unit", type: "string", nullable: false },
          { name: "periodStart", type: "datetime", nullable: false },
          { name: "periodEnd", type: "datetime", nullable: false },
          { name: "source", type: "string", nullable: false },
          { name: "formula", type: "string", nullable: false },
          { name: "freshnessStatus", type: "string", nullable: false },
          { name: "confidenceLevel", type: "string", nullable: false },
          { name: "targetValue", type: "number", nullable: true },
        ],
      },
    ],
  }
}
