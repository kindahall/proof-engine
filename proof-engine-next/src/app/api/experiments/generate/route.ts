import { NextResponse } from "next/server"
import { AIRateLimitError } from "@/lib/ai/rate-limit"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { ExperimentGenerationBlockedError, generateExperimentFromRuntime } from "@/lib/experiments/service"

export async function POST() {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  try {
    const experiment = await generateExperimentFromRuntime(auth.user)
    return NextResponse.json({ ok: true, experiment })
  } catch (error) {
    if (error instanceof ExperimentGenerationBlockedError) {
      return NextResponse.json(
        { ok: false, error: "diagnostic_insufficient", message: error.message },
        { status: 409 },
      )
    }
    if (error instanceof AIRateLimitError) {
      return NextResponse.json(
        { ok: false, error: "ai_rate_limit", message: error.message, limit: error.limit },
        { status: 429 },
      )
    }
    return handleApiError(error, { route: "/api/experiments/generate", operation: "POST" })
  }
}
