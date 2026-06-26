import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { CanonicalPathGuard } from "@/components/layout/canonical-path-guard"
import { AppStatusBanner } from "@/components/shared/app-status-banner"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getAuthenticatedUser()
  const context = user && isSupabaseServerConfigured() ? await ensureWorkspaceForUser(user) : null
  const activeWorkspaceSlug = context?.workspaceSlug ?? workspaceSlug
  const activeProjectId = context?.projectId ?? "project"
  const workspaceName = context?.workspaceName ?? prettifyWorkspaceName(activeWorkspaceSlug)
  const workspaceTeam = context?.workspacePlan ? planLabel(context.workspacePlan) : "Espace local"
  const projectName = context?.projectName ?? workspaceName

  return (
    <SidebarProvider>
      <AppSidebar
        workspaceSlug={activeWorkspaceSlug}
        projectId={activeProjectId}
        workspaceName={workspaceName}
        workspaceTeam={workspaceTeam}
      />
      <SidebarInset>
        {context ? <CanonicalPathGuard workspaceSlug={context.workspaceSlug} projectId={context.projectId} /> : null}
        {context ? null : <AppStatusBanner />}
        <AppTopbar dashboardHref={`/app/${activeWorkspaceSlug}/dashboard`} projectName={projectName} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function prettifyWorkspaceName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function planLabel(plan: string) {
  if (plan === "free") return "Plan gratuit"
  return `Plan ${plan}`
}
