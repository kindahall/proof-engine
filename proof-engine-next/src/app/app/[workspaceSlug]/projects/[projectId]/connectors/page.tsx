import Link from "next/link"
import { Plus, Database, Flame, Server, Webhook, CreditCard, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { connectorProviderLabel, connectorStatusLabel, statusTone } from "@/lib/mock/labels"
import type { ConnectorProvider } from "@/lib/mock/types"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { getConnectorCards } from "@/lib/connectors/view-models"

export const metadata = { title: "Connecteurs" }

const providerIcon: Record<ConnectorProvider, typeof Database> = {
  postgres: Database,
  supabase_postgres: Database,
  firebase_firestore: Flame,
  rest_api: Server,
  webhook_events: Webhook,
  stripe_readonly: CreditCard,
}

export default async function ConnectorsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const basePath = `/app/${workspaceSlug}/projects/${projectId}/connectors`
  const user = await getAuthenticatedUser()
  const connectors = await getConnectorCards(user)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Connecteurs"
        description="Les sources de données réelles de votre application, en lecture seule."
        action={
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="size-4" /> Ajouter une source
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3">
        {connectors.map((c) => {
          const Icon = providerIcon[c.provider]
          return (
            <Link key={c.id} href={`${basePath}/${c.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <ToneBadge tone={statusTone[c.status]}>{connectorStatusLabel[c.status]}</ToneBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {connectorProviderLabel[c.provider]} · {c.recordsSynced.toLocaleString("fr-FR")} enregistrements
                    </p>
                    {c.lastError && <p className="text-xs text-destructive">{c.lastError}</p>}
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
