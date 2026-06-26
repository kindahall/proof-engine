import type { GatewayProviderKind } from "@/lib/connectors/schemas"
import type { GatewayProvider } from "@/lib/gateway/types"
import { HttpGatewayProvider } from "@/lib/gateway/providers/http"
import { MockGatewayProvider } from "@/lib/gateway/providers/mock"
import { PreparedGatewayProvider } from "@/lib/gateway/providers/prepared"

export function getGatewayProvider(kind: GatewayProviderKind): GatewayProvider {
  switch (kind) {
    case "mock_gateway":
      return new MockGatewayProvider()
    case "http_gateway":
      return new HttpGatewayProvider()
    case "mcp_gateway":
      return new PreparedGatewayProvider("Gateway MCP")
    case "codex_mcp_gateway":
      return new PreparedGatewayProvider("Codex MCP Gateway")
    case "hermes_style_gateway":
      return new PreparedGatewayProvider("Hermes-style Gateway")
  }
}
