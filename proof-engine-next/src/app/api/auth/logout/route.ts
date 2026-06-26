import { NextResponse, type NextRequest } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { SupabaseConfigError } from "@/lib/supabase/env"
import { createSupabaseCookieClient } from "@/lib/supabase/request"

export async function POST(request: NextRequest) {
  try {
    const { supabase, applyCookies } = createSupabaseCookieClient(request)
    await supabase.auth.signOut()

    return applyCookies(NextResponse.json({ ok: true, redirectTo: "/login" }))
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ ok: true, redirectTo: "/login" })
    }
    return handleApiError(error, { route: "/api/auth/logout", operation: "POST" })
  }
}
