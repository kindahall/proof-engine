import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { LockedState } from "@/components/shared/locked-state"
import { ToneBadge } from "@/components/shared/tone-badge"
import { GenerateExperimentButton } from "@/features/experiments/generate-experiment-button"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { experimentStatusLabel, experimentStatusTone } from "@/lib/mock/labels"
import { listExperimentsForUser } from "@/lib/experiments/service"

export const metadata = { title: "Expériences" }

export default async function ExperimentsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const user = await getAuthenticatedUser()
  const experiments = await listExperimentsForUser(user ?? undefined)
  const projectBase = `/app/${workspaceSlug}/projects/${projectId}`

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Expériences"
        description="Une seule expérience peut être active à la fois."
        action={<GenerateExperimentButton workspaceSlug={workspaceSlug} projectId={projectId} />}
      />
      {experiments.length === 0 ? (
        <LockedState
          icon={FlaskConical}
          title="Aucune expérience disponible"
          description="Les expériences se génèrent à partir d'un diagnostic. Connectez une source et lancez votre premier diagnostic pour en créer une."
          connectorHref={`${projectBase}/connectors/new`}
          dataQualityHref={`${projectBase}/data-quality`}
        />
      ) : (
        <div className="grid gap-3">
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/app/${workspaceSlug}/projects/${projectId}/experiments/${experiment.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{experiment.title}</p>
                      <ToneBadge tone={experimentStatusTone[experiment.status]}>
                        {experimentStatusLabel[experiment.status]}
                      </ToneBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{experiment.hypothesis}</p>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right">
                    <p>{experiment.primaryMetric.name}</p>
                    <p>
                      {experiment.primaryMetric.current ?? experiment.primaryMetric.baseline ?? "—"}
                      {experiment.primaryMetric.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
