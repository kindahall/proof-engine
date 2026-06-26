import { NextResponse } from "next/server"
import { captureException, type ObservabilityContext } from "@/lib/observability/server"
import { toSupabaseOperationalError } from "@/lib/supabase/errors"

export interface ApiErrorContext extends ObservabilityContext {
  route: string
  operation: string
}

export function getApiErrorResponse(error: unknown, context?: ApiErrorContext) {
  const supabaseError = toSupabaseOperationalError(error)
  if (!supabaseError) return null
  captureException(error, {
    ...context,
    level: "warn",
    event: "proof_engine.api_supabase_operational_error",
    errorCode: supabaseError.error,
  })

  return NextResponse.json(
    {
      ok: false,
      ...supabaseError,
    },
    { status: 503 },
  )
}

export function handleApiError(error: unknown, context: ApiErrorContext): NextResponse {
  const response = getApiErrorResponse(error, context)
  if (response) return response

  captureException(error, {
    ...context,
    level: "error",
    event: "proof_engine.api_unhandled_error",
  })
  throw error
}
