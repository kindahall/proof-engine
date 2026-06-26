import type { EvidenceItem } from "@/lib/analytics/metrics"
import type { DiagnosticOutput } from "@/lib/ai/schemas"

export function validateEvidenceIds(output: DiagnosticOutput | { evidenceIds: string[] }, evidence: EvidenceItem[]) {
  const allowed = new Set(evidence.map((item) => item.id))
  const ids =
    "bottleneck" in output
      ? [
          ...output.bottleneck.evidenceIds,
          ...output.facts.flatMap((item) => item.evidenceIds),
          ...output.signals.flatMap((item) => item.evidenceIds),
          ...output.assumptions.flatMap((item) => item.evidenceIds),
        ]
      : output.evidenceIds
  const unknown = ids.filter((id) => !allowed.has(id))

  return {
    ok: unknown.length === 0,
    unknown,
  }
}

export function computeCompletenessScore(input: { facts: number; signals: number; assumptions: number; unknowns: number; metrics: number }) {
  const evidenceScore = Math.min(45, input.facts * 12 + input.signals * 6 + input.assumptions * 2)
  const metricScore = Math.min(35, input.metrics * 7)
  const unknownPenalty = Math.min(25, input.unknowns * 5)
  return Math.max(0, Math.min(100, evidenceScore + metricScore + 20 - unknownPenalty))
}

export function computeConfidenceScore(input: { evidence: EvidenceItem[]; metrics: number; dataQualityScore: number }) {
  const facts = input.evidence.filter((item) => item.classification === "fact")
  const nonAssumptions = input.evidence.filter((item) => item.classification !== "assumption")

  if (input.evidence.length < 3) return Math.min(30, input.dataQualityScore)
  if (nonAssumptions.length === 0) return Math.min(25, input.dataQualityScore)

  const strengthScore = facts.reduce((sum, item) => {
    if (item.strength === "strong") return sum + 12
    if (item.strength === "medium") return sum + 7
    return sum + 3
  }, 0)
  const metricScore = Math.min(20, input.metrics * 3)
  const qualityScore = Math.round(input.dataQualityScore * 0.35)

  return Math.max(0, Math.min(92, strengthScore + metricScore + qualityScore))
}
