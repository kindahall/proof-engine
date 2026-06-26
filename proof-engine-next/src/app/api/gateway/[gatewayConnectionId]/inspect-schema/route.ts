import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { inspectGatewaySchema } from "@/lib/gateway/service"

export async function POST(_: Request, context: { params: Promise<{ gatewayConnectionId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { gatewayConnectionId } = await context.params
    const schema = await inspectGatewaySchema(gatewayConnectionId, auth.user)
    return NextResponse.json({ ok: true, schema })
  } catch (error) {
    return handleApiError(error, { route: "/api/gateway/[gatewayConnectionId]/inspect-schema", operation: "POST" })
  }
}
