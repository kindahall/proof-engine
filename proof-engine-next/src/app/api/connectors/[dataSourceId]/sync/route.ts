import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { syncConnector } from "@/lib/connectors/service"

export async function POST(_: Request, context: { params: Promise<{ dataSourceId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { dataSourceId } = await context.params
    const run = await syncConnector(dataSourceId, "manual", auth.user)
    return NextResponse.json({ ok: run.status === "success", syncRun: run }, { status: run.status === "success" ? 200 : 400 })
  } catch (error) {
    return handleApiError(error, { route: "/api/connectors/[dataSourceId]/sync", operation: "POST" })
  }
}
