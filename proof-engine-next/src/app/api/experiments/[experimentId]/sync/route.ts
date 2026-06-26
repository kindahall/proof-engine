import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { syncExperimentResult } from "@/lib/experiments/service"

export async function POST(_: Request, context: { params: Promise<{ experimentId: string }> }) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const { experimentId } = await context.params
    const result = await syncExperimentResult(experimentId, auth.user)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    return handleApiError(error, { route: "/api/experiments/[experimentId]/sync", operation: "POST" })
  }
}
