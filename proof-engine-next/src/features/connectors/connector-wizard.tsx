"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Database,
  Flame,
  Server,
  Webhook,
  CreditCard,
  Loader2,
  CircleCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ToneBadge } from "@/components/shared/tone-badge"
import { PageHeader } from "@/components/shared/page-header"
import { toast } from "sonner"

type SourceConfig = {
  id: string
  label: string
  icon: typeof Database
  dataSourceId: string
  /** Mot utilisé pour décrire les objets détectés (tables, collections, endpoints…). */
  objectNoun: string
  /** Label + placeholder du champ identifiant de l'étape Paramètres. */
  endpointLabel: string
  endpointPlaceholder: string
  secretLabel: string
  namePlaceholder: string
}

const SOURCES: SourceConfig[] = [
  {
    id: "postgres",
    label: "PostgreSQL (Neon, serveur, RDS…)",
    icon: Database,
    dataSourceId: "ds_postgres",
    objectNoun: "tables",
    endpointLabel: "Chaîne de connexion",
    endpointPlaceholder: "postgresql://user:••••@host:5432/db",
    secretLabel: "Mot de passe (si hors chaîne de connexion)",
    namePlaceholder: "Ex. Postgres production",
  },
  {
    id: "supabase_postgres",
    label: "Supabase",
    icon: Database,
    dataSourceId: "ds_supabase",
    objectNoun: "tables",
    endpointLabel: "Chaîne de connexion Supabase",
    endpointPlaceholder: "postgresql://postgres:••••@db.xxxx.supabase.co:5432/postgres",
    secretLabel: "Mot de passe (si hors chaîne de connexion)",
    namePlaceholder: "Ex. Supabase production",
  },
  {
    id: "firebase_firestore",
    label: "Firebase / Firestore",
    icon: Flame,
    dataSourceId: "ds_firebase",
    objectNoun: "collections",
    endpointLabel: "Identifiant du projet Firebase",
    endpointPlaceholder: "mon-projet-id",
    secretLabel: "Service account (JSON, lecture seule)",
    namePlaceholder: "Ex. Firebase production",
  },
  {
    id: "rest_api",
    label: "Endpoint REST",
    icon: Server,
    dataSourceId: "ds_rest",
    objectNoun: "endpoints",
    endpointLabel: "URL de base de l'API",
    endpointPlaceholder: "https://api.monapp.com/v1",
    secretLabel: "Token d'accès (lecture seule)",
    namePlaceholder: "Ex. API interne",
  },
  {
    id: "webhook_events",
    label: "Webhook / collecteur",
    icon: Webhook,
    dataSourceId: "ds_webhook",
    objectNoun: "événements",
    endpointLabel: "URL réceptrice (générée)",
    endpointPlaceholder: "https://proof-engine.app/ingest/…",
    secretLabel: "Clé de signature",
    namePlaceholder: "Ex. Collecteur produit",
  },
  {
    id: "stripe_readonly",
    label: "Stripe (lecture seule)",
    icon: CreditCard,
    dataSourceId: "ds_stripe",
    objectNoun: "objets Stripe",
    endpointLabel: "Compte Stripe",
    endpointPlaceholder: "acct_…",
    secretLabel: "Clé restreinte (restricted key)",
    namePlaceholder: "Ex. Stripe production",
  },
]

const WIZARD_STEPS = ["Type", "Paramètres", "Test & scan", "Mapping", "Synchronisation"]

export function ConnectorWizard({ connectorsHref }: { connectorsHref: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [source, setSource] = useState<string | null>(null)
  const [tested, setTested] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [scanSummary, setScanSummary] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [savedDataSourceId, setSavedDataSourceId] = useState<string | null>(null)
  const [connectorName, setConnectorName] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [secret, setSecret] = useState("")
  const [eventsTable, setEventsTable] = useState("events")

  const pct = Math.round(((step + 1) / WIZARD_STEPS.length) * 100)
  const canNext = step === 0 ? !!source : step === 2 ? tested : true
  const selectedSource = SOURCES.find((s) => s.id === source) ?? null
  const dataSourceId = savedDataSourceId ?? selectedSource?.dataSourceId ?? null
  const isPostgresSource = source === "postgres" || source === "supabase_postgres"
  const usesEventContainer = isPostgresSource || source === "firebase_firestore"
  const eventContainerLabel = isPostgresSource ? "Table des événements" : "Collection d'événements"
  const requiresInitialSync = source !== "webhook_events"

  function resetConnectionState() {
    setTested(false)
    setSynced(false)
    setScanSummary(null)
    setConnectionError(null)
    setSavedDataSourceId(null)
  }

  async function saveAndTestConnection() {
    if (!dataSourceId) return
    setTesting(true)
    setTested(false)
    setSynced(false)
    setConnectionError(null)
    try {
      if (!selectedSource || !source) return
      const saveResponse = await fetch("/api/connectors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: source,
          name: connectorName.trim() || selectedSource.namePlaceholder.replace(/^Ex\. /, ""),
          endpoint,
          secret,
          eventsTable: usesEventContainer ? eventsTable : undefined,
        }),
      })
      const savePayload = await saveResponse.json()
      if (!saveResponse.ok) throw new Error(savePayload.message ?? "Sauvegarde du connecteur impossible.")
      const persistedDataSourceId = savePayload.dataSourceId as string
      setSavedDataSourceId(persistedDataSourceId)

      const testResponse = await fetch(`/api/connectors/${persistedDataSourceId}/test`, { method: "POST" })
      const testPayload = await testResponse.json()
      if (!testResponse.ok) throw new Error(testPayload.message ?? "Connexion refusee.")

      setTested(true)
      if (!requiresInitialSync) setSynced(true)
      setScanSummary(testPayload.message ?? "Connexion validée en lecture seule.")
      toast.success("Connexion validée", { description: "Le secret est enregistré côté serveur et prêt pour la synchronisation." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue."
      setConnectionError(message)
      toast.error("Connexion impossible", {
        description: message,
      })
    } finally {
      setTesting(false)
    }
  }

  async function syncInitialEvents() {
    if (!savedDataSourceId) return
    setSyncing(true)
    setConnectionError(null)
    try {
      const syncResponse = await fetch(`/api/connectors/${savedDataSourceId}/sync`, { method: "POST" })
      const syncPayload = await syncResponse.json()
      if (!syncResponse.ok || syncPayload.syncRun?.status === "error") {
        throw new Error(syncPayload.syncRun?.errorMessage ?? "Synchronisation impossible.")
      }

      setSynced(true)
      setScanSummary(`${syncPayload.syncRun.recordsInserted} événements synchronisés`)
      toast.success("Synchronisation terminée", { description: `${syncPayload.syncRun.recordsInserted} événements synchronisés.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue."
      setConnectionError(message)
      toast.error("Synchronisation impossible", { description: message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={connectorsHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Connecteurs
      </Link>
      <PageHeader title="Connecter une source" description="Assistant de connexion en lecture seule." />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Étape {step + 1} / {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} />

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSource(s.id)
                    resetConnectionState()
                  }}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                    source === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <s.icon className="size-5 text-muted-foreground" /> {s.label}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Saisissez les paramètres de connexion. Le secret sera chiffré côté serveur.
              </p>
              <div className="space-y-1.5">
                <Label>Nom du connecteur</Label>
                <Input
                  value={connectorName}
                  onChange={(event) => {
                    setConnectorName(event.target.value)
                    resetConnectionState()
                  }}
                  placeholder={selectedSource?.namePlaceholder ?? "Ex. Source de production"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{selectedSource?.endpointLabel ?? "Identifiant / endpoint"}</Label>
                <Input
                  value={endpoint}
                  onChange={(event) => {
                    setEndpoint(event.target.value)
                    resetConnectionState()
                  }}
                  placeholder={selectedSource?.endpointPlaceholder ?? "identifiant ou https://…"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{selectedSource?.secretLabel ?? "Secret (lecture seule)"}</Label>
                <Input
                  value={secret}
                  onChange={(event) => {
                    setSecret(event.target.value)
                    resetConnectionState()
                  }}
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              {usesEventContainer && (
                <div className="space-y-1.5">
                  <Label>{eventContainerLabel}</Label>
                  <Input
                    value={eventsTable}
                    onChange={(event) => {
                      setEventsTable(event.target.value)
                      resetConnectionState()
                    }}
                    placeholder="events"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={saveAndTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 className="size-4 animate-spin" /> : "Tester la connexion"}
              </Button>
              {tested && (
                <div className="space-y-2">
                  <ToneBadge tone="success"><CircleCheck className="size-3.5" /> Connexion réussie</ToneBadge>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">Connexion validée</p>
                    <ul className="mt-1 space-y-0.5 font-mono text-xs text-muted-foreground">
                      <li>{selectedSource?.objectNoun ?? "Objets"} prêts pour une lecture seule</li>
                      <li>Secret stocké chiffré côté serveur</li>
                      <li>Synchronisation lancée uniquement à l'étape suivante</li>
                    </ul>
                  </div>
                  {scanSummary && <p className="text-xs text-muted-foreground">{scanSummary}</p>}
                </div>
              )}
              {connectionError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="font-medium">Connexion à la source non disponible</p>
                  <p className="mt-1">{connectionError}</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Le mapping sera proposé après inspection réelle de la source connectée. Aucun événement n'est prérempli.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">Canonique</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-3 py-3 text-xs text-muted-foreground" colSpan={2}>
                        Aucun mapping disponible avant connexion à la source.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <ToneBadge tone={synced ? "success" : "warning"}>
                <CircleCheck className="size-3.5" /> {synced ? "Première synchronisation terminée" : requiresInitialSync ? "Synchronisation à lancer" : "Collecteur prêt"}
              </ToneBadge>
              <p className="text-muted-foreground">
                {requiresInitialSync
                  ? "Lancez une première lecture pour créer les événements et métriques de référence."
                  : "Le collecteur recevra les événements signés dès que votre application les enverra."}
              </p>
              {requiresInitialSync && !synced && (
                <Button type="button" variant="outline" onClick={syncInitialEvents} disabled={!tested || syncing}>
                  {syncing ? <Loader2 className="size-4 animate-spin" /> : "Lancer la synchronisation"}
                </Button>
              )}
              {scanSummary && <p className="text-xs text-muted-foreground">{scanSummary}</p>}
              {connectionError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="font-medium">Synchronisation non disponible</p>
                  <p className="mt-1">{connectionError}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Précédent
            </Button>
            {step < WIZARD_STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continuer
              </Button>
            ) : (
              <Button onClick={() => router.push(connectorsHref)} disabled={requiresInitialSync && !synced}>Terminer</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
