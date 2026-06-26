import { TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FunnelStep } from "@/lib/mock/types"

/**
 * Visual funnel: each stage is a horizontal bar whose width is proportional to
 * its volume. The step with the worst conversion from the previous one is
 * highlighted in red as the bottleneck.
 */
export function Funnel({ steps, highlightDropAfter }: { steps: FunnelStep[]; highlightDropAfter?: number }) {
  const max = steps[0]?.count ?? 1
  // worst conversion index (the step whose conversionFromPrev is lowest)
  const worstIdx =
    highlightDropAfter ??
    steps.reduce(
      (worst, s, i) =>
        s.conversionFromPrev != null && s.conversionFromPrev < (steps[worst].conversionFromPrev ?? 999) ? i : worst,
      1,
    )

  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => {
        const pct = (s.count / max) * 100
        const isDrop = i === worstIdx
        return (
          <div key={s.event}>
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-right text-xs text-muted-foreground">{s.label}</div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted">
                <div
                  className={cn(
                    "flex h-full items-center justify-end rounded-md px-2 text-xs font-medium text-white transition-all",
                    isDrop ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  {s.count.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="w-14 shrink-0 text-xs text-muted-foreground">
                {s.conversionFromPrev != null && (
                  <span className={isDrop ? "font-medium text-destructive" : ""}>{s.conversionFromPrev}%</span>
                )}
              </div>
            </div>
            {isDrop && (
              <div className="ml-32 mt-0.5 flex items-center gap-1 pl-3 text-[11px] font-medium text-destructive">
                <TrendingDown className="size-3" />
                Rupture principale ici
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
