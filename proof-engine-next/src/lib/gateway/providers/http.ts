import { connectorConfig } from "@/config/connectors"
import { gatewayHealthResultSchema, gatewaySchemaResultSchema, metricSnapshotSchema, sourceEventSchema } from "@/lib/connectors/schemas"
import type { GatewayProvider } from "@/lib/gateway/types"

async function postJson<T>(endpoint: string, operation: string, token: string | undefined, payload: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), connectorConfig.gatewayTimeoutMs)
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ operation, payload }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Gateway HTTP error ${response.status}`)
    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

export class HttpGatewayProvider implements GatewayProvider {
  async testConnection(input: Parameters<GatewayProvider["testConnection"]>[0]) {
    const result = await postJson<unknown>(input.profile.endpoint, "health.check", input.token, {})
    return gatewayHealthResultSchema.parse(result)
  }

  async listCapabilities(input: Parameters<GatewayProvider["listCapabilities"]>[0]) {
    const health = await this.testConnection(input)
    return health.capabilities
  }

  async inspectSchema(input: Parameters<GatewayProvider["inspectSchema"]>[0]) {
    const result = await postJson<unknown>(input.profile.endpoint, "schema.inspect", input.token, {})
    return gatewaySchemaResultSchema.parse(result)
  }

  async readEvents(input: Parameters<GatewayProvider["readEvents"]>[0]) {
    const result = await postJson<unknown>(input.profile.endpoint, "events.read", input.token, { since: input.since, limit: input.limit })
    return sourceEventSchema.array().parse(Array.isArray(result) ? result : (result as { events?: unknown }).events)
  }

  async readEntities(input: Parameters<GatewayProvider["readEntities"]>[0]) {
    const result = await postJson<unknown>(input.profile.endpoint, "entities.read", input.token, { since: input.since, limit: input.limit })
    const entities = Array.isArray(result) ? result : (result as { entities?: unknown }).entities
    return entities as Record<string, unknown>[]
  }

  async readMetrics(input: Parameters<GatewayProvider["readMetrics"]>[0]) {
    const result = await postJson<unknown>(input.profile.endpoint, "metrics.read", input.token, {})
    return metricSnapshotSchema.array().parse(Array.isArray(result) ? result : (result as { metrics?: unknown }).metrics)
  }
}
