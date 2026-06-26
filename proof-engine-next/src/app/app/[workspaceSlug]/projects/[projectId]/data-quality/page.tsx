import Link from "next/link"
import { Check, X, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { CountUp } from "@/components/shared/count-up"
import { evaluateDataQualityGate, type DataQualityGateResult } from "@/lib/analytics/metrics"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { getConnectorCards } from "@/lib/connectors/view-models"
import { listPersistedEventMappingsForUser, loadPersistedRuntimeState } from "@/lib/persistence/supabase"
import { getRuntimeState } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export const metadata = { title: "Qualité des données" }

async function getGate(): Promise<DataQualityGateResult> {
  const user = await getAuthenticatedUser()
  const persistedRuntime = user && isSupabaseServerConfigured()
  const [state, activeMappings] = persistedRuntime
    ? await Promise.all([
        loadPersistedRuntimeState(user),
        listPersistedEventMappingsForUser(user).then((mappings) => mappings.filter((mapping) => mapping.active).length),
      ])
    : [getRuntimeState(), 0]
  const connectorCards = await getConnectorCards(user)
  const connectedSources = connectorCards.filter((connector) => connector.status === "connected").length
  const lastSuccessfulSync = state.syncRuns.find((run) => run.status === "success")?.finishedAt ?? null

  return evaluateDataQualityGate({
    connectedSources,
    lastSuccessfulSyncAt: lastSuccessfulSync,
    activeMappings,
    events: state.rawEvents,
    metrics: state.metricSnapshots,
  })
}

export default async function DataQualityPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const gate = await getGate()
  const isBlocked = gate.status === "blocked"

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Qualité des données"
        description="Le diagnostic complet reste bloqué tant qu'aucune source n'est connectée et synchronisée."
        action={
          <Button asChild>
            <Link href={`/app/${workspaceSlug}/projects/${projectId}/connectors/new`}>
              <Database className="size-4" /> Connecter une source
            </Link>
          </Button>
        }
      />

      <Card className={isBlocked ? "border-amber-200 bg-amber-50/40 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20"}>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ToneBadge tone={isBlocked ? "warning" : "success"}>
              {isBlocked ? "Diagnostic bloqué" : "Diagnostic déverrouillé"}
            </ToneBadge>
            <span className="text-sm text-muted-foreground">
              Score qualité : <CountUp value={gate.score} suffix="/100" className="font-medium text-foreground" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isBlocked ? "Données réelles insuffisantes." : "Données synchronisées exploitables."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="pe-lift">
          <CardHeader><CardTitle className="text-sm">Contrôles (data quality gate)</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {gate.checks.map((check) => (
                <li key={check.key} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${check.ok ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950" : "bg-amber-100 text-amber-600 dark:bg-amber-950"}`}>
                    {check.ok ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <div>
                    <p className="text-sm">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="pe-lift">
          <CardHeader><CardTitle className="text-sm">Pourquoi c'est bloqué</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Le projet cible est configuré, mais Proof Engine ne connaît pas encore les tables ou collections de la source ni les événements trackés.
            </p>
            <p>
              Le produit refuse donc de calculer un tunnel, une activation ou une recommandation tant que la source réelle n'a pas été inspectée.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
