import Link from "next/link"
import { Plus, Network, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { listGatewayProfilesForUser } from "@/lib/gateway/service"
import { gatewayProviderLabel, statusTone, connectorStatusLabel } from "@/lib/mock/labels"

export const metadata = { title: "Gateway" }

export default async function GatewayPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const basePath = `/app/${workspaceSlug}/projects/${projectId}/gateway`
  const user = await getAuthenticatedUser()
  const gatewayProfiles = await listGatewayProfilesForUser(user ?? undefined)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Gateway"
        description="Accès en lecture seule aux sources via un Gateway compatible Codex / MCP / HTTP."
        action={
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="size-4" /> Ajouter un Gateway
            </Link>
          </Button>
        }
      />

      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        L'IA n'accède jamais aux secrets : elle ne peut demander que des opérations typées, validées et auditées
        (inspect_schema, read_events_since, run_metric_query…). Les écritures sont interdites.
      </div>

      <div className="grid gap-3">
        {gatewayProfiles.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-5 text-sm text-muted-foreground">
              <p>Aucun Gateway de production n'est configuré. Le Gateway mock reste réservé aux tests internes.</p>
            </CardContent>
          </Card>
        ) : (
          gatewayProfiles.map((g) => (
            <Link key={g.id} href={`${basePath}/${g.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Network className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.name}</span>
                        <ToneBadge tone={statusTone[g.status]}>{connectorStatusLabel[g.status]}</ToneBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {gatewayProviderLabel[g.provider]} · {g.transport.toUpperCase()} · lecture seule
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.capabilities.map((c) => (
                      <span key={c} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
