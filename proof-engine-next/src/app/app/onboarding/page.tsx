import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { routes } from "@/lib/routes"

export const metadata = { title: "Onboarding" }

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser()
  const context = user && isSupabaseServerConfigured() ? await ensureWorkspaceForUser(user) : null
  const dataQualityHref = context
    ? `/app/${context.workspaceSlug}/projects/${context.projectId}/data-quality`
    : routes.dataQuality
  const connectorHref = context
    ? `/app/${context.workspaceSlug}/projects/${context.projectId}/connectors/new`
    : routes.connectorNew

  return <OnboardingWizard dataQualityHref={dataQualityHref} connectorHref={connectorHref} />
}
