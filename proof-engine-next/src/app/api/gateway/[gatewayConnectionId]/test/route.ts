import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { gatewayConnectionInputSchema } from "@/lib/connectors/schemas"
import { testPersistedGatewayConnection } from "@/lib/gateway/service"

export async function POST(request: Request, context: { params: Promise<{ gatewayConnectionId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { gatewayConnectionId } = await context.params
    const json = await request.json().catch(() => ({}))
    const input = gatewayConnectionInputSchema.partial().parse(json)
    const result = await testPersistedGatewayConnection(gatewayConnectionId, auth.user, input)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleApiError(error, { route: "/api/gateway/[gatewayConnectionId]/test", operation: "POST" })
  }
}
