import { connectorConfig } from "@/config/connectors"
import { sourceEventSchema, type SourceEvent } from "@/lib/connectors/schemas"

export class RestApiConnectorProvider {
  constructor(private readonly endpoint: string, private readonly token?: string) {}

  async testConnection() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), connectorConfig.gatewayTimeoutMs)
    try {
      const response = await fetch(this.endpoint, {
        method: "GET",
        headers: this.token ? { authorization: `Bearer ${this.token}` } : {},
        signal: controller.signal,
      })
      return {
        ok: response.ok,
        status: response.ok ? ("healthy" as const) : ("blocked" as const),
        latencyMs: 0,
        message: response.ok ? "Endpoint REST accessible en lecture seule." : `HTTP ${response.status}`,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  async readEvents(): Promise<SourceEvent[]> {
    const response = await fetch(this.endpoint, {
      headers: this.token ? { authorization: `Bearer ${this.token}` } : {},
    })
    if (!response.ok) throw new Error(`REST connector read failed: ${response.status}`)
    const payload = await response.json()
    return sourceEventSchema.array().parse(Array.isArray(payload) ? payload : payload.events)
  }
}
