import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { testConnector } from "@/lib/connectors/service"

export async function POST(_: Request, context: { params: Promise<{ dataSourceId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { dataSourceId } = await context.params
    const result = await testConnector(dataSourceId, auth.user)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleApiError(error, { route: "/api/connectors/[dataSourceId]/test", operation: "POST" })
  }
}
