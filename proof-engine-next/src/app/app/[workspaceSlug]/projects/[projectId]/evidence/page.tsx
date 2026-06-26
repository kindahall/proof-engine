import { FileSearch } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LockedState } from "@/components/shared/locked-state"
import { EvidenceInbox } from "@/features/evidence/evidence-inbox"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { listPersistedEvidenceForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export const metadata = { title: "Preuves" }

async function getEvidenceItems() {
  const user = await getAuthenticatedUser()
  if (!user || !isSupabaseServerConfigured()) return []

  return listPersistedEvidenceForUser(user)
}

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const items = await getEvidenceItems()
  const projectBase = `/app/${workspaceSlug}/projects/${projectId}`

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Preuves"
        description="Alimentée automatiquement par vos sources connectées. Les preuves quantitatives ne se saisissent pas à la main."
      />
      {items.length === 0 ? (
        <LockedState
          icon={FileSearch}
          title="Aucune preuve synchronisée"
          description="Les faits, signaux et hypothèses apparaîtront ici dès que votre source sera synchronisée et vos événements mappés."
          connectorHref={`${projectBase}/connectors/new`}
          dataQualityHref={`${projectBase}/data-quality`}
        />
      ) : (
        <EvidenceInbox items={items} />
      )}
    </div>
  )
}
