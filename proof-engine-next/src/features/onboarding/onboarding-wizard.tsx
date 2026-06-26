"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check,
  Database,
  Flame,
  Webhook,
  CreditCard,
  Server,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/components/shared/logo"
import { ToneBadge } from "@/components/shared/tone-badge"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { routes } from "@/lib/routes"
import {
  trackOnboardingCompleted,
  trackSubscriptionIntentCaptured,
} from "@/lib/marketing-analytics/client"

const STEPS = [
  "Produit",
  "Connexion backend",
  "Mapping des données",
  "Marché & offre",
  "Métriques détectées",
  "Objectif",
]

const SOURCES = [
  { id: "postgres", label: "PostgreSQL (Neon, serveur, RDS…)", icon: Database },
  { id: "supabase_postgres", label: "Supabase", icon: Database },
  { id: "firebase_firestore", label: "Firebase / Firestore", icon: Flame },
  { id: "rest_api", label: "Endpoint REST", icon: Server },
  { id: "webhook_events", label: "Webhook / collecteur", icon: Webhook },
  { id: "stripe_readonly", label: "Stripe (lecture seule)", icon: CreditCard },
]

const CHANNELS = ["Bouche-à-oreille", "SEO / contenu", "Publicité payante", "Partenariats"]
type CommercialGoal = "acquisition" | "activation" | "conversion" | "retention"

export function OnboardingWizard({
  dataQualityHref = routes.dataQuality,
  connectorHref = routes.connectorNew,
}: {
  dataQualityHref?: string
  connectorHref?: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [source, setSource] = useState<string | null>(null)
  const [channels, setChannels] = useState<string[]>(["Bouche-à-oreille"])
  const [commercialGoal, setCommercialGoal] = useState<CommercialGoal>("activation")

  const pct = Math.round(((step + 1) / STEPS.length) * 100)
  const connected = false

  const toggleChannel = (c: string) =>
    setChannels((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))

  const completeOnboarding = () => {
    const properties = {
      commercial_goal: commercialGoal,
      connected_source: source ?? "none",
      selected_channels: channels,
      source: "onboarding_wizard",
    }

    trackOnboardingCompleted(properties)
    trackSubscriptionIntentCaptured({
      ...properties,
      intent_stage: "onboarding_completed",
    })
    router.push(dataQualityHref)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <Link href={routes.marketing}>
          <Logo size={26} />
        </Link>
        <LanguageToggle />
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez vos données réelles pour débloquer un diagnostic fiable.
          </p>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Étape {step + 1} / {STEPS.length} · {STEPS[step]}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-1.5" />

          <Card className="mt-5">
            <CardContent className="pt-6">
              {step === 0 && <StepProduct />}
              {step === 1 && (
                <StepBackend
                  source={source}
                  setSource={setSource}
                  connectorHref={connectorHref}
                />
              )}
              {step === 2 && <StepMapping />}
              {step === 3 && <StepMarket />}
              {step === 4 && <StepMetrics />}
              {step === 5 && (
                <StepGoal
                  channels={channels}
                  commercialGoal={commercialGoal}
                  setCommercialGoal={setCommercialGoal}
                  toggleChannel={toggleChannel}
                />
              )}

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  Précédent
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep((s) => s + 1)}>Enregistrer et continuer</Button>
                ) : (
                  <Button onClick={completeOnboarding}>
                    Vérifier la qualité des données
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!connected && step >= 2 && (
            <p className="mt-3 text-xs text-amber-600">
              Le diagnostic complet restera bloqué tant qu'une source connectée n'a pas réussi une première synchronisation.
            </p>
          )}
        </div>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold">Progression</p>
            <ul className="mt-3 space-y-2">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                      i < step
                        ? "bg-primary text-primary-foreground"
                        : i === step
                          ? "border-2 border-primary text-primary"
                          : "border text-muted-foreground"
                    }`}
                  >
                    {i < step ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className={i === step ? "font-medium" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Vous pouvez quitter et reprendre l'onboarding à tout moment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  )
}

function StepProduct() {
  return (
    <div className="space-y-4">
      <Field label="Nom du produit" defaultValue="myteuf.com" />
      <Field label="URL (facultatif)" defaultValue="https://myteuf.com" />
      <div className="space-y-1.5">
        <Label>Description courte</Label>
        <Textarea defaultValue="Projet à analyser avec les données réelles de votre source." rows={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Modèle économique</Label>
          <Input defaultValue="À préciser" />
        </div>
        <div className="space-y-1.5">
          <Label>Type de produit</Label>
          <Select defaultValue="multi">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">SaaS simple</SelectItem>
              <SelectItem value="multi">SaaS multi-acteurs</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="event">App événementielle</SelectItem>
              <SelectItem value="collab">Outil collaboratif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function StepBackend({
  source,
  setSource,
  connectorHref,
}: {
  source: string | null
  setSource: (s: string) => void
  connectorHref: string
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cette étape est obligatoire avant un diagnostic complet. Toutes les connexions sont en lecture seule.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
              source === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <s.icon className="size-5 text-muted-foreground" />
            {s.label}
          </button>
        ))}
      </div>
      {source && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Paramètres de connexion</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Permissions requises : lecture seule des collections / tables. Le secret est chiffré côté serveur.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={connectorHref}>Ouvrir le wizard connecteur</Link>
            </Button>
            <ToneBadge tone="outline">Synchronisation requise</ToneBadge>
          </div>
        </div>
      )}
    </div>
  )
}

function StepMapping() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Confirmez le mapping proposé entre vos événements sources et les événements canoniques. Aucune saisie de chiffres.
      </p>
      <div className="overflow-hidden rounded-lg border">
        <div className="space-y-2 p-4">
          <p className="text-sm font-medium">Aucun mapping proposé</p>
          <p className="text-sm text-muted-foreground">
            Proof Engine proposera les correspondances après une inspection réussie de la source connectée.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Aucun mapping n'est prérempli tant que la source n'a pas été inspectée.
      </p>
    </div>
  )
}

function StepMarket() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Segment cible" defaultValue="À préciser" />
      <Field label="Utilisateur principal" defaultValue="À préciser" />
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Problème résolu</Label>
        <Textarea defaultValue="À préciser après cadrage du produit." rows={2} />
      </div>
      <Field label="Déclencheur d'achat" defaultValue="À préciser" />
      <Field label="Alternative actuelle" defaultValue="À préciser" />
      <Field label="Prix ou fourchette" defaultValue="À préciser" />
      <Field label="Mode de vente" defaultValue="À préciser" />
    </div>
  )
}

function StepMetrics() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Métriques détectées automatiquement depuis vos sources. Les valeurs ne sont pas éditables.
      </p>
      <div className="overflow-hidden rounded-lg border">
        <div className="space-y-2 p-4">
          <p className="text-sm font-medium">Aucune métrique détectée</p>
          <p className="text-sm text-muted-foreground">
            Les métriques seront calculées automatiquement depuis les événements synchronisés. Aucune valeur ne se saisit à la main.
          </p>
          <ToneBadge tone="warning">Synchronisation requise</ToneBadge>
        </div>
      </div>
    </div>
  )
}

function StepGoal({
  channels,
  commercialGoal,
  setCommercialGoal,
  toggleChannel,
}: {
  channels: string[]
  commercialGoal: CommercialGoal
  setCommercialGoal: (goal: CommercialGoal) => void
  toggleChannel: (c: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Objectif commercial prioritaire</Label>
        <Select
          value={commercialGoal}
          onValueChange={(value) => setCommercialGoal(value as CommercialGoal)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="acquisition">Plus d'acquisition</SelectItem>
            <SelectItem value="activation">Améliorer l'activation</SelectItem>
            <SelectItem value="conversion">Augmenter la conversion payante</SelectItem>
            <SelectItem value="retention">Améliorer la rétention</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget d'expérimentation" defaultValue="0 € (organique)" />
        <Field label="Délai souhaité" defaultValue="2 semaines" />
      </div>
      <div className="space-y-2">
        <Label>Canaux déjà accessibles</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <label key={c} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
              <Checkbox checked={channels.includes(c)} onCheckedChange={() => toggleChannel(c)} />
              {c}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Définition de l'activation (hypothèse configurable)</Label>
        <Textarea
          defaultValue="≥ 3 participants et ≥ 20 photos dans les 48 h suivant le premier partage."
          rows={2}
        />
      </div>
    </div>
  )
}
