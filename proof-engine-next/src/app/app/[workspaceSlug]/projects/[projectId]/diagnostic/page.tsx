import { Compass, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { LockedState } from "@/components/shared/locked-state"
import { CountUp } from "@/components/shared/count-up"
import { ConfidenceRing } from "@/components/shared/confidence-ring"
import { GenerateExperimentButton } from "@/features/experiments/generate-experiment-button"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { runDiagnosticFromRuntime } from "@/lib/diagnostics/service"

export const metadata = { title: "Diagnostic" }

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const user = await getAuthenticatedUser()
  const result = await runDiagnosticFromRuntime(user ?? undefined)
  const { diagnostic } = result
  const insufficient = diagnostic.status === "insufficient"
  const projectBase = `/app/${workspaceSlug}/projects/${projectId}`

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Diagnostic"
        description="Un seul goulot prioritaire, fondé sur vos preuves connectées."
        action={
          insufficient ? (
            <ToneBadge tone="warning">Données insuffisantes · {result.scores.confidenceScore}/100</ToneBadge>
          ) : (
            <GenerateExperimentButton workspaceSlug={workspaceSlug} projectId={projectId} />
          )
        }
      />

      {insufficient && (
        <>
          <LockedState
            icon={Compass}
            title="Diagnostic non disponible"
            description={diagnostic.summary}
            connectorHref={`${projectBase}/connectors/new`}
            dataQualityHref={`${projectBase}/data-quality`}
          />
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4">
              <h2 className="text-base font-semibold">Données réelles insuffisantes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connectez votre source en lecture seule puis vérifiez les événements synchronisés avant de lancer le diagnostic.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!insufficient && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" /> Goulot prioritaire détecté
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-md">
                <p className="font-medium capitalize">{diagnostic.bottleneck.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-muted-foreground">{diagnostic.bottleneck.rationale}</p>
              </div>
              <ConfidenceRing value={result.scores.confidenceScore} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <ScoreTile label="Confiance" value={result.scores.confidenceScore} />
              <ScoreTile label="Complétude" value={result.scores.completenessScore} />
              <ScoreTile label="Qualité data" value={result.scores.dataQualityScore} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's needed to unlock */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HelpCircle className="size-4 text-amber-500" /> Questions à résoudre
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostic.missingEvidence.length > 0 ? (
              <ul className="space-y-3">
                {diagnostic.missingEvidence.map((item) => (
                  <li key={item.question} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <span className="block font-medium">{item.question}</span>
                      <span className="text-muted-foreground">{item.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {diagnostic.facts.map((item) => (
                  <li key={item.statement} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      <span className="block font-medium">{item.statement}</span>
                      <span className="text-muted-foreground">Preuves : {item.evidenceIds.join(", ")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowRight className="size-4 text-primary" /> Prochaine action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">{diagnostic.nextBestAction}</p>
            <p className="text-muted-foreground">{diagnostic.warnings.join(" ")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="pe-lift rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">
        <CountUp value={value} suffix="/100" />
      </p>
    </div>
  )
}
