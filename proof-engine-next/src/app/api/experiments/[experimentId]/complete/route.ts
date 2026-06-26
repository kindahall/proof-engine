import { NextResponse } from "next/server"
import { AIRateLimitError } from "@/lib/ai/rate-limit"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { completeExperiment } from "@/lib/experiments/service"

export async function POST(_: Request, context: { params: Promise<{ experimentId: string }> }) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const { experimentId } = await context.params
  try {
    const result = await completeExperiment(experimentId, auth.user)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      return NextResponse.json(
        { ok: false, error: "ai_rate_limit", message: error.message, limit: error.limit },
        { status: 429 },
      )
    }
    return handleApiError(error, { route: "/api/experiments/[experimentId]/complete", operation: "POST" })
  }
}
