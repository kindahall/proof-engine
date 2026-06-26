import type { User } from "@supabase/supabase-js"
import { generateEvidenceFromMetrics, evaluateDataQualityGate } from "@/lib/analytics/metrics"
import type { DataQualityGateResult, EvidenceItem } from "@/lib/analytics/metrics"
import type { DiagnosticOutput } from "@/lib/ai/schemas"
import { sampleEventMappings } from "@/lib/connectors/mapping"
import { getAIProvider } from "@/lib/ai/provider"
import { withAIRateLimit } from "@/lib/ai/rate-limit"
import { computeCompletenessScore, computeConfidenceScore } from "@/lib/diagnostics/scoring"
import { getRuntimeState } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import {
  listPersistedEventMappingsForUser,
  loadPersistedRuntimeState,
  persistDiagnosticRun,
} from "@/lib/persistence/supabase"

function buildInsufficientDiagnostic(gate: DataQualityGateResult, evidence: EvidenceItem[]): DiagnosticOutput {
  const facts = evidence
    .filter((item) => item.classification === "fact")
    .map((item) => ({ statement: item.content, evidenceIds: [item.id] }))
  const signals = evidence
    .filter((item) => item.classification === "signal")
    .map((item) => ({ statement: item.content, evidenceIds: [item.id] }))
  const assumptions = evidence
    .filter((item) => item.classification === "assumption")
    .map((item) => ({ statement: item.content, evidenceIds: [item.id] }))
  const failedChecks = gate.checks.filter((check) => !check.ok)

  return {
    status: "insufficient",
    summary: "Données insuffisantes pour produire un diagnostic IA fiable.",
    facts,
    signals,
    assumptions,
    bottleneck: {
      type: "unknown",
      rationale: "Le data quality gate n'est pas passé.",
      evidenceIds: [],
    },
    missingEvidence: failedChecks.map((check) => ({
      question: check.label,
      reason: check.detail,
    })),
    nextBestAction: failedChecks.some((check) => check.key === "source")
      ? "Connecter une source read-only puis synchroniser les événements."
      : "Synchroniser les événements et compléter le mapping avant de relancer le diagnostic.",
    warnings: ["Aucun appel IA n'est exécuté tant que les données validées sont insuffisantes."],
  }
}

export async function runDiagnosticFromRuntime(user?: User) {
  const persistedRuntime = user && isSupabaseServerConfigured()
  const [state, activeMappings] = persistedRuntime
    ? await Promise.all([
        loadPersistedRuntimeState(user),
        listPersistedEventMappingsForUser(user).then((mappings) => mappings.filter((mapping) => mapping.active).length),
      ])
    : [getRuntimeState(), sampleEventMappings.filter((mapping) => mapping.isActive).length]
  const lastSuccessfulSync = state.syncRuns.find((run) => run.status === "success")?.finishedAt ?? null
  const gate = evaluateDataQualityGate({
    connectedSources: lastSuccessfulSync ? 1 : 0,
    lastSuccessfulSyncAt: lastSuccessfulSync,
    activeMappings,
    events: state.rawEvents,
    metrics: state.metricSnapshots,
  })
  const evidence = generateEvidenceFromMetrics(state.rawEvents, state.metricSnapshots)
  const facts = evidence.filter((item) => item.classification === "fact").length
  const signals = evidence.filter((item) => item.classification === "signal").length
  const assumptions = evidence.filter((item) => item.classification === "assumption").length
  const unknowns = evidence.filter((item) => item.classification === "unknown").length
  const completenessScore = computeCompletenessScore({ facts, signals, assumptions, unknowns, metrics: state.metricSnapshots.length })
  const confidenceScore = computeConfidenceScore({ evidence, metrics: state.metricSnapshots.length, dataQualityScore: gate.score })

  if (gate.status !== "passed") {
    return {
      gate,
      evidence,
      scores: {
        confidenceScore,
        completenessScore,
        dataQualityScore: gate.score,
      },
      diagnostic: buildInsufficientDiagnostic(gate, evidence),
    }
  }

  const diagnosticInput = { evidence, metrics: state.metricSnapshots, confidenceScore }
  const diagnostic = await withAIRateLimit(
    user,
    () => getAIProvider().generateDiagnostic(diagnosticInput),
    { feature: "diagnostic", promptVersion: "diagnostic@runtime-v1", input: diagnosticInput },
  )

  return {
    gate,
    evidence,
    scores: {
      confidenceScore,
      completenessScore,
      dataQualityScore: gate.score,
    },
    diagnostic,
  }
}

export async function runAndPersistDiagnosticFromRuntime(user: User) {
  const result = await runDiagnosticFromRuntime(user)
  if (!isSupabaseServerConfigured()) return { ...result, diagnosticId: null }

  const persisted = await persistDiagnosticRun({
    user,
    diagnostic: result.diagnostic,
    scores: result.scores,
    evidence: result.evidence,
    metrics: user ? (await loadPersistedRuntimeState(user)).metricSnapshots : [],
  })

  return {
    ...result,
    diagnosticId: persisted.diagnosticId,
  }
}
