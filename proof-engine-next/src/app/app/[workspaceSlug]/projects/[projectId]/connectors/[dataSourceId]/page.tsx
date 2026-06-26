import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { connectorProviderLabel, connectorStatusLabel, statusTone } from "@/lib/mock/labels"
import { ConnectorSyncButton } from "@/features/connectors/connector-actions"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { getConnectorCard } from "@/lib/connectors/view-models"

export default async function ConnectorDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; dataSourceId: string }>
}) {
  const { workspaceSlug, projectId, dataSourceId } = await params
  const basePath = `/app/${workspaceSlug}/projects/${projectId}/connectors`
  const user = await getAuthenticatedUser()
  const c = await getConnectorCard(user, dataSourceId)
  if (!c) notFound()

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={basePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Connecteurs
      </Link>
      <PageHeader
        title={c.name}
        description={connectorProviderLabel[c.provider]}
        action={<ToneBadge tone={statusTone[c.status]}>{connectorStatusLabel[c.status]}</ToneBadge>}
      />

      {c.lastError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{c.lastError}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Synchronisation</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Mode" value={c.syncMode === "scheduled" ? "Planifiée" : c.syncMode === "incremental" ? "Incrémentale" : "Manuelle"} />
          <Row label="Dernière synchronisation" value={fmt(c.lastSyncAt)} />
          <Row label="Prochaine synchronisation" value={fmt(c.nextSyncAt)} />
          <Row label="Enregistrements synchronisés" value={c.recordsSynced.toLocaleString("fr-FR")} />
          <Separator />
          <div className="flex gap-2">
            {c.status === "connected" ? (
              <ConnectorSyncButton dataSourceId={c.id} />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href={`${basePath}/new`}>Configurer la source</Link>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            La synchronisation manuelle relit les données ; elle ne permet jamais de saisir des valeurs à la main.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Permissions</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {c.permissions.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" /> {p}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Le secret de connexion est chiffré côté serveur et n'est jamais envoyé au navigateur.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
