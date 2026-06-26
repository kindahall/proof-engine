import { cn } from "@/lib/utils"
import type { EvidenceStrength } from "@/lib/mock/types"

const levels: Record<EvidenceStrength, number> = { weak: 1, medium: 2, strong: 3 }
const labels: Record<EvidenceStrength, string> = { weak: "Faible", medium: "Moyenne", strong: "Forte" }

/** Visual strength as 3 dots instead of a text label. */
export function StrengthDots({ strength }: { strength: EvidenceStrength }) {
  const n = levels[strength]
  return (
    <span className="inline-flex items-center gap-1" title={`Force : ${labels[strength]}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("size-1.5 rounded-full", i <= n ? "bg-primary" : "bg-muted-foreground/25")}
        />
      ))}
    </span>
  )
}
