import Link from "next/link"
import {
  ArrowRight,
  Database,
  FileSearch,
  GitBranch,
  Compass,
  FlaskConical,
  Lightbulb,
  Sparkles,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { SetupJourney } from "@/components/shared/setup-journey"
import { CountUp } from "@/components/shared/count-up"
import { generateEvidenceFromMetrics } from "@/lib/analytics/metrics"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { getConnectorCards } from "@/lib/connectors/view-models"
import { ensureWorkspaceForUser, loadPersistedRuntimeState } from "@/lib/persistence/supabase"
import { getRuntimeState } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export const metadata = { title: "Tableau de bord" }

const lockedFeatures = [
  { icon: Compass, label: "Diagnostic", desc: "Votre goulot prioritaire" },
  { icon: FlaskConical, label: "Expériences", desc: "Tests mesurables" },
  { icon: Lightbulb, label: "Apprentissages", desc: "Ce que vous prouvez" },
]
const initialSetupSteps = 1
const totalSetupSteps = 6

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const user = await getAuthenticatedUser()
  const context = user && isSupabaseServerConfigured() ? await ensureWorkspaceForUser(user) : null
  const activeWorkspaceSlug = context?.workspaceSlug ?? workspaceSlug
  const activeProjectId = context?.projectId ?? "project"
  const projectName = context?.projectName ?? "Projet"
  const projectBase = `/app/${activeWorkspaceSlug}/projects/${activeProjectId}`
  const links = {
    connectorNew: `${projectBase}/connectors/new`,
    connectors: `${projectBase}/connectors`,
    eventMapping: `${projectBase}/event-mapping`,
    evidence: `${projectBase}/evidence`,
    diagnostic: `${projectBase}/diagnostic`,
  }
  const connectorCards = await getConnectorCards(user)
  const state = user && isSupabaseServerConfigured() ? await loadPersistedRuntimeState(user) : getRuntimeState()
  const connectedCount = connectorCards.filter((connector) => connector.status === "connected").length
  const evidenceCount =
    state.rawEvents.length > 0 && state.metricSnapshots.length > 0
      ? generateEvidenceFromMetrics(state.rawEvents, state.metricSnapshots).length
      : 0
  const completedSteps = Math.min(
    totalSetupSteps,
    initialSetupSteps +
      (connectedCount > 0 ? 1 : 0) +
      (state.syncRuns.some((run) => run.status === "success") ? 1 : 0) +
      (evidenceCount > 0 ? 1 : 0),
  )
  const onboardingPct = Math.round((completedSteps / totalSetupSteps) * 100)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Tableau de bord"
        description={`${projectName} est prêt à être configuré.`}
        action={
          <Button asChild>
            <Link href={links.connectorNew}>
              <Database className="size-4" /> Connecter une source
            </Link>
          </Button>
        }
      />

      {/* Hero setup card */}
      <Card className="relative overflow-hidden border-primary/20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)" }}
        />
        <CardContent className="relative space-y-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <ToneBadge tone="warning">
                <Sparkles className="size-3" /> Diagnostic bloqué
              </ToneBadge>
              <h2 className="mt-2 text-xl font-semibold">Branchez vos données pour démarrer</h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Proof Engine lit votre source (PostgreSQL, Supabase, Firebase, REST, webhook ou Stripe) en lecture seule,
                détecte vos événements et débloque le diagnostic. Aucune donnée n&apos;est saisie à la main. Aucune métrique
                n&apos;est affichée tant qu&apos;aucune synchronisation réelle n&apos;a réussi.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                <CountUp value={completedSteps} />
                <span className="text-base font-normal text-muted-foreground">/{totalSetupSteps}</span>
              </p>
              <p className="text-xs text-muted-foreground">étapes</p>
            </div>
          </div>

          <Progress value={onboardingPct} className="h-1.5" />

          <SetupJourney current={completedSteps} />
        </CardContent>
      </Card>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Database} label="Sources connectées" value={`${connectedCount}/${connectorCards.length}`} href={links.connectors} cta="Gérer" />
        <StatTile icon={GitBranch} label="Mappings confirmés" value="—" href={links.eventMapping} cta="Configurer" muted />
        <StatTile icon={FileSearch} label="Preuves" value={evidenceCount === 0 ? "—" : String(evidenceCount)} href={links.evidence} cta="Ouvrir" muted={evidenceCount === 0} />
        <StatTile icon={Compass} label="Confiance diagnostic" value="—" href={links.diagnostic} cta="Voir" muted />
      </div>

      {/* What you'll unlock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lock className="size-4 text-muted-foreground" /> Ce que vous débloquerez
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {lockedFeatures.map((f) => (
            <div
              key={f.label}
              className="group pe-lift relative overflow-hidden rounded-xl border bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
                  <f.icon className="size-4.5" />
                </div>
                <Lock className="size-3.5 text-muted-foreground/60" />
              </div>
              <p className="mt-3 text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Priority source */}
      <Card className="bg-muted/20">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border bg-background text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Branchez votre source de données</p>
              <p className="text-xs text-muted-foreground">
                PostgreSQL · Supabase · Firebase · REST · webhook · Stripe — lecture seule, secret chiffré côté serveur, aucune écriture
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={links.connectorNew}>
              Connecter <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
  cta,
  muted,
}: {
  icon: typeof Database
  label: string
  value: string
  href: string
  cta: string
  muted?: boolean
}) {
  return (
    <Card className="pe-lift">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className={`mt-2 text-2xl font-semibold ${muted ? "text-muted-foreground/50" : ""}`}>{value}</p>
        <Link href={href} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {cta} <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
