import { ShoppingCart, Megaphone, Zap, Repeat, MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BottleneckType } from "@/lib/mock/types"

const STAGES: { type: BottleneckType; label: string; icon: typeof Zap }[] = [
  { type: "acquisition", label: "Acquisition", icon: Megaphone },
  { type: "positioning_offer", label: "Offre", icon: ShoppingCart },
  { type: "conversion", label: "Conversion", icon: MousePointerClick },
  { type: "activation", label: "Activation", icon: Zap },
  { type: "retention", label: "Rétention", icon: Repeat },
]

/**
 * Horizontal map of the five growth stages with the diagnosed bottleneck
 * highlighted — a one-glance "where is the problem" visual.
 */
export function BottleneckMap({ active }: { active: BottleneckType }) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => {
        const isActive = s.type === active
        return (
          <div key={s.type} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-colors",
                isActive
                  ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                  : "border-transparent bg-muted/50",
              )}
            >
              <s.icon className={cn("size-4", isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
              <span className={cn("text-[11px]", isActive ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && <span className="text-muted-foreground/40">→</span>}
          </div>
        )
      })}
    </div>
  )
}
