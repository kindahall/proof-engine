import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { workspaceDashboardPath } from "@/lib/auth/redirects"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { routes } from "@/lib/routes"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export default async function AppIndex() {
  const user = await getAuthenticatedUser()
  if (user && isSupabaseServerConfigured()) {
    const context = await ensureWorkspaceForUser(user)
    redirect(workspaceDashboardPath(context.workspaceSlug))
  }

  redirect(routes.dashboard)
}
