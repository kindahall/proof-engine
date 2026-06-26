import { NextResponse } from "next/server"
import { z } from "zod"
import { connectorConfig } from "@/config/connectors"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { gatewayConnectionInputSchema } from "@/lib/connectors/schemas"
import { testGatewayConnection } from "@/lib/gateway/service"

const testGatewaySchema = gatewayConnectionInputSchema.extend({
  provider: gatewayConnectionInputSchema.shape.provider.unwrap(),
  name: z.string().trim().min(1),
  transport: z.enum(["http", "mcp"]),
  endpoint: z.string().trim().min(1),
  token: z.string().trim().min(1).optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const parsed = testGatewaySchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", message: "Paramètres Gateway invalides." },
        { status: 400 },
      )
    }
    if (
      !connectorConfig.allowedGatewayProviders.includes(parsed.data.provider) ||
      (process.env.NODE_ENV === "production" && parsed.data.provider === "mock_gateway")
    ) {
      return NextResponse.json(
        { ok: false, error: "gateway_provider_not_allowed", message: "Provider Gateway non autorisé." },
        { status: 403 },
      )
    }

    const result = await testGatewayConnection("candidate", parsed.data)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleApiError(error, { route: "/api/gateway/test", operation: "POST" })
  }
}
