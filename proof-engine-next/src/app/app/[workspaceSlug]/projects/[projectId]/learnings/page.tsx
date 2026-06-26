import { Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { LockedState } from "@/components/shared/locked-state"
import { ToneBadge } from "@/components/shared/tone-badge"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { listLearningsForUser } from "@/lib/experiments/service"

export const metadata = { title: "Apprentissages" }

const outcomeTone = {
  validated: "success",
  invalidated: "destructive",
  inconclusive: "warning",
} as const

const outcomeLabel = {
  validated: "Validé",
  invalidated: "Invalidé",
  inconclusive: "Non concluant",
} as const

export default async function LearningsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const user = await getAuthenticatedUser()
  const learnings = await listLearningsForUser(user ?? undefined)
  const projectBase = `/app/${workspaceSlug}/projects/${projectId}`

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Apprentissages"
        description="Ce que vos expériences vous ont appris, conservé pour les prochaines décisions."
      />
      {learnings.length === 0 ? (
        <LockedState
          icon={Lightbulb}
          title="Aucun apprentissage pour l'instant"
          description="Chaque expérience terminée produira ici un apprentissage — validé, invalidé ou non concluant — fondé sur vos données réelles."
          connectorHref={`${projectBase}/connectors/new`}
          dataQualityHref={`${projectBase}/data-quality`}
        />
      ) : (
        <div className="space-y-3">
          {learnings.map((learning) => (
            <Card key={learning.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{learning.experimentTitle}</p>
                    <p className="text-xs text-muted-foreground">{learning.date}</p>
                  </div>
                  <ToneBadge tone={outcomeTone[learning.outcome]}>{outcomeLabel[learning.outcome]}</ToneBadge>
                </div>
                <p className="text-sm">{learning.observedResult}</p>
                {learning.supportedFindings.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Ce qui est soutenu</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {learning.supportedFindings.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{learning.nextRecommendation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
