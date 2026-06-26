import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { loadGatewayProfileForUser } from "@/lib/gateway/service"
import { gatewayProviderLabel, connectorStatusLabel, statusTone } from "@/lib/mock/labels"
import type { GatewayCapability } from "@/lib/mock/types"
import { GatewayActions } from "@/features/gateway/gateway-actions"

const MIN_CAPABILITIES: GatewayCapability[] = [
  "schema.inspect",
  "events.read",
  "entities.read",
  "metrics.read",
  "health.check",
]

const FORBIDDEN = ["data.write", "data.delete", "campaign.send", "email.send", "payment.modify", "backend.mutate"]

export default async function GatewayDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; gatewayConnectionId: string }>
}) {
  const { workspaceSlug, projectId, gatewayConnectionId } = await params
  const user = await getAuthenticatedUser()
  const g = await loadGatewayProfileForUser(gatewayConnectionId, user ?? undefined)
  if (!g) notFound()
  const basePath = `/app/${workspaceSlug}/projects/${projectId}/gateway`

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={basePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Gateway
      </Link>
      <PageHeader
        title={g.name}
        description={`${gatewayProviderLabel[g.provider]} · transport ${g.transport.toUpperCase()}`}
        action={<ToneBadge tone={statusTone[g.status]}>{connectorStatusLabel[g.status]}</ToneBadge>}
      />

      <Card>
        <CardHeader><CardTitle className="text-sm">Capabilities</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Minimales requises pour activation</p>
            <ul className="space-y-1 text-sm">
              {MIN_CAPABILITIES.map((c) => {
                const ok = g.capabilities.includes(c)
                return (
                  <li key={c} className="flex items-center gap-2">
                    {ok ? <Check className="size-4 text-emerald-500" /> : <X className="size-4 text-destructive" />}
                    <span className="font-mono text-xs">{c}</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Optionnelles activées</p>
            <div className="flex flex-wrap gap-1.5">
              {g.capabilities
                .filter((c) => !MIN_CAPABILITIES.includes(c))
                .map((c) => (
                  <span key={c} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">{c}</span>
                ))}
            </div>
          </div>
          <GatewayActions gatewayConnectionId={g.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Scopes & sécurité</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {g.scopes.map((s) => (
              <span key={s} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">{s}</span>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Opérations interdites</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {FORBIDDEN.map((f) => (
                <span key={f} className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-0.5 font-mono text-[11px] text-destructive">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Le token du Gateway est chiffré côté serveur. Aucun secret n'est exposé au navigateur ni commité dans le dépôt.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
