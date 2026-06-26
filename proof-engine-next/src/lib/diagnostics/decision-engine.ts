export type ExperimentDecisionStatus = "validated" | "invalidated" | "inconclusive" | "insufficient_data"

export function decideExperimentOutcome(input: {
  baseline: number | null
  current: number | null
  target: number | null
  direction: "increase" | "decrease"
  guardrailBreached: boolean
  sampleSize: number
  minimumSampleSize?: number
}): { status: ExperimentDecisionStatus; reason: string } {
  const minimumSampleSize = input.minimumSampleSize ?? 30
  if (input.baseline == null || input.current == null || input.sampleSize < minimumSampleSize) {
    return { status: "insufficient_data", reason: "Données insuffisantes pour décider." }
  }
  if (input.guardrailBreached) {
    return { status: "invalidated", reason: "Une metrique de protection est degradee." }
  }

  const delta = input.current - input.baseline
  const improved = input.direction === "increase" ? delta > 0 : delta < 0
  const reachedTarget =
    input.target == null
      ? Math.abs(delta) >= Math.max(1, Math.abs(input.baseline) * 0.1)
      : input.direction === "increase"
        ? input.current >= input.target
        : input.current <= input.target

  if (improved && reachedTarget) return { status: "validated", reason: "La metrique principale atteint la cible sans guardrail degrade." }
  if (!improved) return { status: "invalidated", reason: "La metrique principale ne progresse pas dans la direction attendue." }
  return { status: "inconclusive", reason: "La tendance est positive mais ne suffit pas pour conclure." }
}
