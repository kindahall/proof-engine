import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { syncGatewayEvents } from "@/lib/gateway/service"

export async function POST(_: Request, context: { params: Promise<{ gatewayConnectionId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { gatewayConnectionId } = await context.params
    const run = await syncGatewayEvents(gatewayConnectionId, auth.user)
    return NextResponse.json({ ok: run.status === "success", syncRun: run }, { status: run.status === "success" ? 200 : 400 })
  } catch (error) {
    return handleApiError(error, { route: "/api/gateway/[gatewayConnectionId]/sync", operation: "POST" })
  }
}
