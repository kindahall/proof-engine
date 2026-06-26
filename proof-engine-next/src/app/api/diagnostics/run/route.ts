import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { AIRateLimitError } from "@/lib/ai/rate-limit"
import { runAndPersistDiagnosticFromRuntime } from "@/lib/diagnostics/service"

export async function POST() {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  try {
    const result = await runAndPersistDiagnosticFromRuntime(auth.user)
    return NextResponse.json({ ok: result.gate.status === "passed", ...result }, { status: result.gate.status === "passed" ? 200 : 409 })
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      return NextResponse.json(
        { ok: false, error: "ai_rate_limit", message: error.message, limit: error.limit },
        { status: 429 },
      )
    }
    return handleApiError(error, { route: "/api/diagnostics/run", operation: "POST" })
  }
}
