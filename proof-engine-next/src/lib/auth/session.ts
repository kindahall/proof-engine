import { redirect } from "next/navigation"
import { buildLoginRedirectPath } from "@/lib/auth/redirects"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) return null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser()
  if (!user) redirect(buildLoginRedirectPath())
  return user
}
