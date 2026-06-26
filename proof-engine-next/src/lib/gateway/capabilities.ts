import type { GatewayCapability } from "@/lib/connectors/schemas"

export const MINIMUM_GATEWAY_CAPABILITIES: GatewayCapability[] = [
  "schema.inspect",
  "events.read",
  "entities.read",
  "metrics.read",
  "health.check",
]

export const OPTIONAL_GATEWAY_CAPABILITIES: GatewayCapability[] = [
  "funnels.compute",
  "cohorts.compute",
  "revenue.read",
  "experiments.read",
  "logs.read",
]

export const FORBIDDEN_GATEWAY_CAPABILITIES = [
  "data.write",
  "data.delete",
  "campaign.send",
  "email.send",
  "payment.modify",
  "backend.mutate",
] as const

export function hasMinimumGatewayCapabilities(capabilities: GatewayCapability[]) {
  return MINIMUM_GATEWAY_CAPABILITIES.every((capability) => capabilities.includes(capability))
}
