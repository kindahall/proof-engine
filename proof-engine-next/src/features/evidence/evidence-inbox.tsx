"use client"

import { useState } from "react"
import { CheckCircle2, Radio, HelpCircle, CircleHelp, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ToneBadge } from "@/components/shared/tone-badge"
import { StrengthDots } from "@/components/shared/strength-dots"
import { cn } from "@/lib/utils"
import {
  classificationLabel,
  classificationTone,
  freshnessLabel,
  freshnessTone,
  sourceKindLabel,
} from "@/lib/mock/labels"
import type { Evidence, EvidenceClassification } from "@/lib/mock/types"

const META: Record<
  EvidenceClassification,
  { icon: typeof CheckCircle2; accent: string; color: string }
> = {
  fact: { icon: CheckCircle2, accent: "border-l-emerald-500", color: "text-emerald-600" },
  signal: { icon: Radio, accent: "border-l-primary", color: "text-primary" },
  assumption: { icon: HelpCircle, accent: "border-l-amber-500", color: "text-amber-600" },
  unknown: { icon: CircleHelp, accent: "border-l-muted-foreground/40", color: "text-muted-foreground" },
}

const FILTERS: Array<{ value: EvidenceClassification | "all"; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "fact", label: "Faits" },
  { value: "signal", label: "Signaux" },
  { value: "assumption", label: "Hypothèses" },
  { value: "unknown", label: "Inconnues" },
]

export function EvidenceInbox({ items }: { items: Evidence[] }) {
  const [filter, setFilter] = useState<EvidenceClassification | "all">("all")
  const list = filter === "all" ? items : items.filter((e) => e.classification === filter)
  const counts = (c: EvidenceClassification) => items.filter((e) => e.classification === c).length
  const isEmpty = items.length === 0

  return (
    <div className="space-y-4">
      {/* Visual summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["fact", "signal", "assumption", "unknown"] as EvidenceClassification[]).map((c) => {
          const m = META[c]
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-xl border border-l-4 bg-card p-4 text-left transition-colors hover:bg-muted/40",
                m.accent,
              )}
            >
              <div className="flex items-center justify-between">
                <m.icon className={cn("size-4", m.color)} />
                <span className="text-2xl font-semibold">{counts(c)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{classificationLabel[c]}</p>
            </button>
          )
        })}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as EvidenceClassification | "all")}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isEmpty ? (
        <Card>
          <CardContent className="space-y-4 py-5">
            <div>
              <p className="text-sm font-medium">Aucune preuve synchronisée</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les faits, signaux, hypothèses et inconnues apparaîtront après connexion de votre source et génération automatique depuis les données réelles.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((e) => (
            <EvidenceCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function EvidenceCard({ e }: { e: Evidence }) {
  const m = META[e.classification]
  return (
    <Card className={cn("border-l-4", m.accent)}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <m.icon className={cn("mt-0.5 size-4 shrink-0", m.color)} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{e.code}</span>
              <ToneBadge tone={classificationTone[e.classification]}>{classificationLabel[e.classification]}</ToneBadge>
              <StrengthDots strength={e.strength} />
              <ToneBadge tone={freshnessTone[e.freshness]}>{freshnessLabel[e.freshness]}</ToneBadge>
            </div>
            <p className="mt-1.5 text-sm font-medium">{e.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{sourceKindLabel[e.sourceKind]}</span>
              <span>·</span>
              <span>{e.source}</span>
              {e.tags.map((t) => (
                <span key={t} className="rounded-md bg-muted px-1.5 py-0.5">#{t}</span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" className="size-7 text-emerald-600 hover:text-emerald-600" title="Valider">
              <Check className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" title="Écarter">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
