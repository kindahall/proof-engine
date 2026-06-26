import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  Mail,
  MessageSquare,
  CircleCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { ExperimentChart } from "@/features/experiments/experiment-chart"
import { ExperimentActions } from "@/features/experiments/experiment-actions"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { loadExperimentForUser } from "@/lib/experiments/service"
import { assetTypeLabel, experimentStatusLabel, experimentStatusTone } from "@/lib/mock/labels"
import type { AssetType } from "@/lib/mock/types"

const assetIcon: Record<AssetType, typeof FileText> = {
  landing_page: FileText,
  cold_email: Mail,
  interview_script: MessageSquare,
}

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; experimentId: string }>
}) {
  const { workspaceSlug, projectId, experimentId } = await params
  const user = await getAuthenticatedUser()
  const e = await loadExperimentForUser(experimentId, user ?? undefined)
  if (!e) notFound()

  const m = e.primaryMetric
  const codes = e.evidenceIds

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/app/${workspaceSlug}/projects/${projectId}/experiments`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Expériences
      </Link>
      <PageHeader
        title={e.title}
        description={e.problem}
        action={<ToneBadge tone={experimentStatusTone[e.status]}>{experimentStatusLabel[e.status]}</ToneBadge>}
      />

      {e.abandonReason && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Expérience abandonnée</p>
            <p className="mt-1 text-sm text-muted-foreground">{e.abandonReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Plan */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Hypothèse" value={e.hypothesis} />
        <Detail label="Cible" value={e.targetSegment} />
        <Detail label="Canal" value={e.channel} />
        <Detail label="Offre / variation" value={e.offer} />
      </div>

      {/* Primary metric + chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{m.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {e.series.length > 0 ? (
            <>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-3xl font-semibold">
                    {m.current ?? m.baseline}{m.unit}
                  </p>
                  {m.baseline != null && (
                    <p className="text-sm text-muted-foreground">
                      Référence {m.baseline}{m.unit}
                      {m.target != null && (
                        <> · Objectif {m.target}{m.unit} {m.targetIsHypothesis && <span className="text-amber-600">(hypothèse)</span>}</>
                      )}
                    </p>
                  )}
                </div>
                {e.measurementSource && (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleCheck className="size-3.5 text-emerald-500" /> Suivi automatique · {e.measurementSource}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <ExperimentChart data={e.series} unit={m.unit} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {e.status === "draft"
                ? "Brouillon — complétez l'hypothèse et la métrique pour préparer l'expérience."
                : e.status === "ready"
                  ? "Prête à démarrer. La baseline sera capturée automatiquement au lancement."
                  : "Pas encore de données de suivi."}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Les relevés de métriques ne se saisissent pas à la main : ils proviennent de la source connectée.
          </p>
        </CardContent>
      </Card>

      {/* Guardrails + decision rules */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Métriques de protection</CardTitle></CardHeader>
          <CardContent>
            {e.guardrailMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune métrique de protection définie.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {e.guardrailMetrics.map((g) => (
                  <li key={g.key} className="flex justify-between">
                    <span className="text-muted-foreground">{g.name}</span>
                    <span className="font-medium">{g.value != null ? `${g.value}${g.unit}` : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Règles de décision</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Rule color="text-emerald-600" label="Continuer" value={e.decisionRules.continue} />
            <Rule color="text-amber-600" label="Modifier" value={e.decisionRules.iterate} />
            <Rule color="text-destructive" label="Arrêter" value={e.decisionRules.stop} />
          </CardContent>
        </Card>
      </div>

      {/* Required assets */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ressources d'exécution</CardTitle></CardHeader>
        <CardContent>
          {e.requiredAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ressource requise.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {e.requiredAssets.map((a) => {
                const Icon = assetIcon[a]
                const generated = e.assets.find((x) => x.type === a)?.generated
                return (
                  <div key={a} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="size-4 text-muted-foreground" />
                      {assetTypeLabel[a]}
                    </div>
                    {generated ? (
                      <ToneBadge tone="success">Générée</ToneBadge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Générer</Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Les ressources sont générées sur demande, modifiables et versionnées.
          </p>
        </CardContent>
      </Card>

      {/* Grounding + actions */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Preuves :</span>
            {codes.length ? codes.map((c) => <ToneBadge key={c} tone="default">{c}</ToneBadge>) : <span className="text-sm text-muted-foreground">—</span>}
          </div>
          <div className="flex gap-2">
            <ExperimentActions experimentId={e.id} status={e.status} />
          </div>
        </CardContent>
      </Card>

      {e.notes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes qualitatives</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {e.notes.map((n, i) => (
              <div key={i}>
                <span className="font-medium">{n.author}</span> <span className="text-muted-foreground">— {n.text}</span>
                <span className="ml-1 text-xs text-muted-foreground">({n.date})</span>
                {i < e.notes.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Les notes sont qualitatives et ne remplacent jamais les mesures synchronisées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm">{value}</p>
      </CardContent>
    </Card>
  )
}

function Rule({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div>
      <p className={`text-xs font-semibold ${color}`}>{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  )
}
