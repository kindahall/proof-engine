import { describe, expect, it } from "vitest"
import { diagnosticOutputSchema } from "@/lib/ai/schemas"
import { validateEvidenceIds, computeConfidenceScore } from "@/lib/diagnostics/scoring"
import { decideExperimentOutcome } from "@/lib/diagnostics/decision-engine"
import { applyExperimentStartRule } from "@/lib/experiments/rules"
import type { EvidenceItem } from "@/lib/analytics/metrics"

const evidence: EvidenceItem[] = [
  {
    id: "ev_1",
    code: "F-001",
    title: "Fact",
    content: "Fact",
    classification: "fact",
    sourceKind: "computed_metric",
    source: "mock",
    strength: "strong",
    freshness: "fresh",
    observedAt: "2026-06-24",
    tags: [],
  },
]

describe("diagnostic and decision rules", () => {
  it("rejects unknown evidence IDs", () => {
    const diagnostic = diagnosticOutputSchema.parse({
      status: "sufficient",
      summary: "ok",
      facts: [{ statement: "x", evidenceIds: ["ev_missing"] }],
      signals: [],
      assumptions: [],
      bottleneck: { type: "activation", rationale: "x", evidenceIds: ["ev_1"] },
      missingEvidence: [],
      nextBestAction: "x",
      warnings: [],
    })

    expect(validateEvidenceIds(diagnostic, evidence).ok).toBe(false)
  })

  it("caps confidence when only assumptions exist", () => {
    const assumption = [{ ...evidence[0], id: "ev_h1", classification: "assumption" as const }]
    expect(computeConfidenceScore({ evidence: assumption, metrics: 0, dataQualityScore: 90 })).toBeLessThanOrEqual(30)
  })

  it("validates and invalidates experiments deterministically", () => {
    expect(
      decideExperimentOutcome({
        baseline: 26,
        current: 36,
        target: 35,
        direction: "increase",
        guardrailBreached: false,
        sampleSize: 100,
      }).status,
    ).toBe("validated")

    expect(
      decideExperimentOutcome({
        baseline: 26,
        current: 20,
        target: 35,
        direction: "increase",
        guardrailBreached: false,
        sampleSize: 100,
      }).status,
    ).toBe("invalidated")
  })

  it("enforces one running experiment", () => {
    const result = applyExperimentStartRule(
      [
        { id: "exp_a", status: "running" },
        { id: "exp_b", status: "ready" },
      ],
      "exp_b",
    )
    expect(result.ok).toBe(false)
  })
})
