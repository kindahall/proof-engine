import type { GatewayProviderKind } from "@/lib/connectors/schemas"

export const connectorConfig = {
  gatewayEnabled: process.env.CONNECTOR_GATEWAY_ENABLED !== "false",
  gatewayTimeoutMs: Number(process.env.GATEWAY_REQUEST_TIMEOUT_MS ?? 15_000),
  gatewayMaxRecordsPerRequest: Number(process.env.GATEWAY_MAX_RECORDS_PER_REQUEST ?? 5_000),
  allowedGatewayProviders: (process.env.GATEWAY_ALLOWED_PROVIDERS ??
    "mock_gateway,http_gateway,mcp_gateway,codex_mcp_gateway,hermes_style_gateway")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean) as GatewayProviderKind[],
  webhookProjectKey: process.env.CONNECTOR_WEBHOOK_PROJECT_KEY ?? "demo-project-key",
} as const
