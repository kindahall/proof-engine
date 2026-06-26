import { SettingsView } from "./settings-view"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { loadSettingsForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export const metadata = { title: "Paramètres" }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getAuthenticatedUser()
  const settings = user && isSupabaseServerConfigured() ? await loadSettingsForUser(user) : null
  const activeWorkspaceSlug = settings?.context.workspaceSlug ?? workspaceSlug
  const activeProjectId = settings?.context.projectId ?? "project"
  const projectBase = `/app/${activeWorkspaceSlug}/projects/${activeProjectId}`

  return (
    <SettingsView
      workspace={
        settings?.workspace ?? {
          name: prettifyWorkspaceName(activeWorkspaceSlug),
          slug: activeWorkspaceSlug,
          plan: "local",
        }
      }
      project={
        settings?.project ?? {
          name: "Projet",
          websiteUrl: "",
          description: "",
          productType: "À préciser",
          businessModel: "À préciser",
          stage: "À préciser",
          targetSegment: "À préciser",
          primaryUser: "À préciser",
          problem: "À préciser",
          buyingTrigger: "À préciser",
          currentAlternative: "À préciser",
          valueProposition: "À préciser",
          pricing: "À préciser",
          activationDefinition: "À définir après inspection des événements réels de votre source.",
        }
      }
      members={
        settings?.members ?? [
          {
            name: user?.email ?? "Utilisateur Proof Engine",
            role: "owner",
          },
        ]
      }
      dataLinks={{
        connectors: `${projectBase}/connectors`,
        gateway: `${projectBase}/gateway`,
        dataQuality: `${projectBase}/data-quality`,
      }}
    />
  )
}

function prettifyWorkspaceName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
