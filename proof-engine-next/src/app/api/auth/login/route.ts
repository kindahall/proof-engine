import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import {
  buildPostAuthRedirectPath,
  normalizeNextPath,
  workspaceDashboardPath,
} from "@/lib/auth/redirects"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { handleApiError } from "@/lib/api/errors"
import { createSupabaseCookieClient } from "@/lib/supabase/request"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.safeParse(await request.json().catch(() => ({})))
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", message: "Email ou mot de passe invalide." },
        { status: 400 },
      )
    }

    const { supabase, applyCookies } = createSupabaseCookieClient(request)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.data.email,
      password: body.data.password,
    })

    if (error) {
      return applyCookies(
        NextResponse.json(
          { ok: false, error: "invalid_credentials", message: "Identifiants incorrects." },
          { status: 401 },
        ),
      )
    }

    const explicitNext = normalizeNextPath(body.data.next)
    const context =
      !explicitNext && data.user && isSupabaseServerConfigured()
        ? await ensureWorkspaceForUser(data.user)
        : null

    return applyCookies(
      NextResponse.json({
        ok: true,
        redirectTo: explicitNext ?? (context ? workspaceDashboardPath(context.workspaceSlug) : buildPostAuthRedirectPath()),
      }),
    )
  } catch (error) {
    return handleApiError(error, { route: "/api/auth/login", operation: "POST" })
  }
}
