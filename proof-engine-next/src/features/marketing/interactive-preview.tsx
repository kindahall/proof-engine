"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Radio, HelpCircle, CircleHelp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "fact" | "signal" | "assumption" | "unknown"

const TABS: { key: TabKey; label: string; count: number; icon: typeof CheckCircle2; color: string; dot: string }[] = [
  { key: "fact", label: "Faits", count: 4, icon: CheckCircle2, color: "text-emerald-600", dot: "bg-emerald-500" },
  { key: "signal", label: "Signaux", count: 3, icon: Radio, color: "text-primary", dot: "bg-primary" },
  { key: "assumption", label: "Hypothèses", count: 2, icon: HelpCircle, color: "text-amber-600", dot: "bg-amber-500" },
  { key: "unknown", label: "Inconnues", count: 2, icon: CircleHelp, color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
]

const SAMPLES: Record<TabKey, string[]> = {
  fact: ["Métrique calculée depuis une source connectée", "Citation client synchronisée depuis une table support"],
  signal: ["Segment à comparer après synchronisation", "Canal prometteur à confirmer"],
  assumption: ["Hypothèse fondateur à tester"],
  unknown: ["Événement source non mappé", "Métrique d'activation à définir"],
}

const FUNNEL = [
  { label: "Étape 1", value: 100, drop: false },
  { label: "Étape 2", value: 72, drop: true },
  { label: "Étape 3", value: 61, drop: false },
  { label: "Étape 4", value: 48, drop: false },
  { label: "Étape 5", value: 35, drop: false },
]

/** Interactive, tilting product preview with clickable evidence tabs and an animated funnel. */
export function InteractivePreview() {
  const [tab, setTab] = useState<TabKey>("fact")
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [grown, setGrown] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 250)
    return () => clearTimeout(t)
  }, [])

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: py * -6, y: px * 8 })
  }

  const active = TABS.find((t) => t.key === tab)!

  return (
    <div className="pe-float [perspective:1200px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d" }}
        className="rounded-2xl border bg-card/80 p-4 shadow-2xl backdrop-blur transition-transform duration-200 ease-out"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Aperçu — projet connecté</p>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500 pe-pulse-dot" /> exemple illustratif
          </span>
        </div>

        {/* Clickable evidence tabs */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-lg border border-l-[3px] p-2 text-left transition-all",
                tab === t.key ? "scale-[1.03] bg-muted/60 shadow-sm" : "hover:bg-muted/40",
                t.key === "fact" && "border-l-emerald-500",
                t.key === "signal" && "border-l-primary",
                t.key === "assumption" && "border-l-amber-500",
                t.key === "unknown" && "border-l-muted-foreground/40",
              )}
            >
              <t.icon className={cn("size-3.5", t.color)} />
              <p className="mt-1 text-base font-semibold leading-none">{t.count}</p>
              <p className="text-[10px] text-muted-foreground">{t.label}</p>
            </button>
          ))}
        </div>

        {/* Sample evidence for active tab */}
        <div className="mt-3 space-y-1.5">
          {SAMPLES[tab].map((s) => (
            <div key={s} className="flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", active.dot)} />
              <span className="text-xs">{s}</span>
            </div>
          ))}
        </div>

        {/* Animated funnel */}
        <div className="mt-4 rounded-lg border bg-background/60 p-3">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">Tunnel — où ça décroche</p>
          <div className="space-y-1.5">
            {FUNNEL.map((f, i) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground">{f.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className={cn("h-full rounded transition-[width] duration-700 ease-out", f.drop ? "bg-destructive" : "bg-primary")}
                    style={{ width: grown ? `${f.value}%` : "0%", transitionDelay: `${i * 90}ms` }}
                  />
                </div>
                <span className={cn("w-8 text-[10px]", f.drop ? "font-semibold text-destructive" : "text-muted-foreground")}>
                  {f.value}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-destructive">
            <TrendingDown className="size-3" /> Goulot : étape à confirmer par les données
          </p>
        </div>
      </div>
    </div>
  )
}
