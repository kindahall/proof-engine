import { z } from "zod"

export const bottleneckSchema = z.enum([
  "acquisition",
  "positioning_offer",
  "conversion",
  "activation",
  "retention",
  "unknown",
])

export const diagnosticOutputSchema = z.object({
  status: z.enum(["sufficient", "insufficient"]),
  summary: z.string().min(1),
  facts: z.array(z.object({ statement: z.string(), evidenceIds: z.array(z.string()) })),
  signals: z.array(z.object({ statement: z.string(), evidenceIds: z.array(z.string()) })),
  assumptions: z.array(z.object({ statement: z.string(), evidenceIds: z.array(z.string()) })),
  bottleneck: z.object({
    type: bottleneckSchema,
    rationale: z.string(),
    evidenceIds: z.array(z.string()),
  }),
  missingEvidence: z.array(z.object({ question: z.string(), reason: z.string() })),
  nextBestAction: z.string(),
  warnings: z.array(z.string()),
})

export const experimentPlanOutputSchema = z.object({
  title: z.string().min(1),
  hypothesis: z.string().min(1),
  targetSegment: z.string().min(1),
  problem: z.string().min(1),
  channel: z.string().min(1),
  offer: z.string().min(1),
  valueProposition: z.string().min(1),
  rationale: z.string().min(1),
  primaryMetric: z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    unit: z.string(),
    baseline: z.number().nullable(),
    target: z.number().nullable(),
    targetIsHypothesis: z.boolean(),
    direction: z.enum(["increase", "decrease"]),
  }),
  guardrailMetrics: z.array(z.object({ key: z.string(), name: z.string(), unit: z.string() })).max(2),
  durationDays: z.number().int().positive(),
  estimatedBudget: z.number().nullable(),
  steps: z.array(z.object({ order: z.number().int().positive(), title: z.string(), description: z.string() })),
  decisionRules: z.object({ continue: z.string(), iterate: z.string(), stop: z.string() }),
  requiredAssets: z.array(z.enum(["landing_page", "cold_email", "interview_script"])),
  evidenceIds: z.array(z.string()),
  risks: z.array(z.string()),
})

export const learningOutputSchema = z.object({
  outcome: z.enum(["validated", "invalidated", "inconclusive"]),
  observedResult: z.string(),
  supportedFindings: z.array(z.string()),
  rejectedFindings: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  reusableLearnings: z.array(z.string()),
  nextRecommendation: z.string(),
  evidenceIds: z.array(z.string()),
})

export type DiagnosticOutput = z.infer<typeof diagnosticOutputSchema>
export type ExperimentPlanOutput = z.infer<typeof experimentPlanOutputSchema>
export type LearningOutput = z.infer<typeof learningOutputSchema>
