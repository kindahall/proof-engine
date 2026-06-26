import type {
  GatewayCapability,
  GatewayHealthResult,
  GatewayProfileConfig,
  GatewaySchemaResult,
  MetricSnapshot,
  SourceEvent,
} from "@/lib/connectors/schemas"

export interface GatewayConnectionRef {
  profile: GatewayProfileConfig
  token?: string
}

export interface GatewayProvider {
  testConnection(input: GatewayConnectionRef): Promise<GatewayHealthResult>
  listCapabilities(input: GatewayConnectionRef): Promise<GatewayCapability[]>
  inspectSchema(input: GatewayConnectionRef): Promise<GatewaySchemaResult>
  readEvents(input: GatewayConnectionRef & { since?: string; limit?: number }): Promise<SourceEvent[]>
  readEntities(input: GatewayConnectionRef & { since?: string; limit?: number }): Promise<Record<string, unknown>[]>
  readMetrics(input: GatewayConnectionRef): Promise<MetricSnapshot[]>
}
