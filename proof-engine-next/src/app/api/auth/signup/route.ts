import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { onboardingPath } from "@/lib/auth/redirects"
import { upsertUserProfile } from "@/lib/auth/profiles"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { handleApiError } from "@/lib/api/errors"
import { createSupabaseCookieClient } from "@/lib/supabase/request"

const signupSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = signupSchema.safeParse(await request.json().catch(() => ({})))
    if (!body.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_payload",
          message: "Renseignez un nom, un email valide et un mot de passe d'au moins 8 caractères.",
        },
        { status: 400 },
      )
    }

    const { supabase, applyCookies } = createSupabaseCookieClient(request)
    const { data, error } = await supabase.auth.signUp({
      email: body.data.email,
      password: body.data.password,
      options: {
        data: {
          full_name: body.data.fullName,
        },
      },
    })

    if (error) {
      return applyCookies(
        NextResponse.json(
          { ok: false, error: "signup_failed", message: error.message },
          { status: 400 },
        ),
      )
    }

    if (data.user && isSupabaseServerConfigured()) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: body.data.fullName,
      })
      await ensureWorkspaceForUser(data.user)
    }

    const requiresEmailConfirmation = !data.session
    return applyCookies(
      NextResponse.json({
        ok: true,
        requiresEmailConfirmation,
        redirectTo: requiresEmailConfirmation ? null : onboardingPath,
        message: requiresEmailConfirmation
          ? "Compte créé. Vérifiez votre email avant de vous connecter."
          : "Compte créé.",
      }),
    )
  } catch (error) {
    return handleApiError(error, { route: "/api/auth/signup", operation: "POST" })
  }
}
