import type { User } from "@supabase/supabase-js"
import { getAIProvider } from "@/lib/ai/provider"
import { withAIRateLimit } from "@/lib/ai/rate-limit"
import { runDiagnosticFromRuntime } from "@/lib/diagnostics/service"
import { decideExperimentOutcome } from "@/lib/diagnostics/decision-engine"
import { applyExperimentStartRule } from "@/lib/experiments/rules"
import { getRuntimeState } from "@/lib/runtime/store"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import {
  createPersistedExperimentFromPlan,
  createPersistedLearning,
  listPersistedExperimentsForUser,
  listPersistedLearningsForUser,
  loadPersistedExperimentForUser,
  loadPersistedRuntimeState,
  persistDiagnosticRun,
  updatePersistedExperimentForUser,
} from "@/lib/persistence/supabase"

export class ExperimentGenerationBlockedError extends Error {
  constructor(message = "Diagnostic insuffisant pour générer une expérience.") {
    super(message)
    this.name = "ExperimentGenerationBlockedError"
  }
}

async function getState(user?: User) {
  return user && isSupabaseServerConfigured() ? await loadPersistedRuntimeState(user) : getRuntimeState()
}

async function findExperimentMetric(metricKey: string, user?: User) {
  const aliases: Record<string, string> = {
    first_photo_24h: "first_photo_rate",
  }
  const state = await getState(user)
  return state.metricSnapshots.find((item) => item.key === metricKey) ?? state.metricSnapshots.find((item) => item.key === aliases[metricKey])
}

export async function generateExperimentFromRuntime(user?: User) {
  const diagnostic = await runDiagnosticFromRuntime(user)
  const state = await getState(user)

  if (diagnostic.gate.status !== "passed" || diagnostic.diagnostic.status !== "sufficient") {
    throw new ExperimentGenerationBlockedError(diagnostic.diagnostic.summary)
  }

  const experimentInput = {
    diagnostic: diagnostic.diagnostic,
    metrics: state.metricSnapshots,
  }
  const plan = await withAIRateLimit(
    user,
    () => getAIProvider().generateExperiment(experimentInput),
    { feature: "experiment", promptVersion: "experiment@runtime-v1", input: experimentInput },
  )

  if (!user || !isSupabaseServerConfigured()) return plan

  const persistedDiagnostic = await persistDiagnosticRun({
    user,
    diagnostic: diagnostic.diagnostic,
    scores: diagnostic.scores,
    evidence: diagnostic.evidence,
    metrics: state.metricSnapshots,
  })
  return createPersistedExperimentFromPlan({
    user,
    diagnosticId: persistedDiagnostic.diagnosticId,
    plan,
  })
}

export async function listExperimentsForUser(user?: User) {
  if (user && isSupabaseServerConfigured()) return listPersistedExperimentsForUser(user)
  return []
}

export async function loadExperimentForUser(experimentId: string, user?: User) {
  if (user && isSupabaseServerConfigured()) return loadPersistedExperimentForUser(user, experimentId)
  void experimentId
  return null
}

export async function listLearningsForUser(user?: User) {
  if (user && isSupabaseServerConfigured()) return listPersistedLearningsForUser(user)
  return []
}

export async function startExperiment(experimentId: string, user?: User) {
  const visibleExperiments = await listExperimentsForUser(user)
  const result = applyExperimentStartRule(visibleExperiments, experimentId)
  if (!result.ok) return result
  const startedAt = new Date().toISOString()

  if (user && isSupabaseServerConfigured()) {
    const experiment = await loadPersistedExperimentForUser(user, experimentId)
    const metric = experiment ? await findExperimentMetric(experiment.primaryMetric.key, user) : null
    const updated = await updatePersistedExperimentForUser({
      user,
      experimentId,
      status: "running",
      startedAt,
      primaryMetric: {
        ...(experiment?.primaryMetric ?? {}),
        baseline: metric?.value ?? experiment?.primaryMetric.baseline ?? null,
        measurementSource: metric?.source ?? experiment?.measurementSource ?? null,
      },
    })
    return { ok: Boolean(updated), reason: updated ? null : "Experience inconnue.", startedAt, experiment: updated }
  }

  return { ok: true, reason: null, startedAt }
}

export async function syncExperimentResult(experimentId: string, user?: User) {
  const experiment = await loadExperimentForUser(experimentId, user)
  if (!experiment) return { ok: false, reason: "Experience inconnue." }
  const metric = await findExperimentMetric(experiment.primaryMetric.key, user)

  if (metric && user && isSupabaseServerConfigured()) {
    await updatePersistedExperimentForUser({
      user,
      experimentId,
      primaryMetric: {
        ...experiment.primaryMetric,
        current: metric.value,
        measurementSource: metric.source,
      },
    })
  }

  return {
    ok: Boolean(metric),
    metric,
    reason: metric ? null : "Metrique non synchronisee.",
  }
}

export async function completeExperiment(experimentId: string, user?: User) {
  const experiment = await loadExperimentForUser(experimentId, user)
  if (!experiment) return { ok: false, reason: "Experience inconnue." }
  const metric = await findExperimentMetric(experiment.primaryMetric.key, user)
  const state = await getState(user)
  const decision = decideExperimentOutcome({
    baseline: experiment.primaryMetric.baseline,
    current: metric?.value ?? experiment.primaryMetric.current,
    target: experiment.primaryMetric.target,
    direction: experiment.primaryMetric.direction,
    guardrailBreached: false,
    sampleSize: state.rawEvents.length,
  })
  const outcome: "validated" | "invalidated" | "inconclusive" =
    decision.status === "validated" ? "validated" : decision.status === "invalidated" ? "invalidated" : "inconclusive"
  const diagnostic = await runDiagnosticFromRuntime(user)
  const learningInput = {
    experimentTitle: experiment.title,
    outcome,
    evidence: diagnostic.evidence,
  }
  const learning = await withAIRateLimit(
    user,
    () => getAIProvider().generateLearning(learningInput),
    { feature: "learning", promptVersion: "learning@runtime-v1", input: learningInput },
  )

  if (user && isSupabaseServerConfigured()) {
    await updatePersistedExperimentForUser({
      user,
      experimentId,
      status: "completed",
      endedAt: new Date().toISOString(),
      finalOutcome: outcome,
      primaryMetric: {
        ...experiment.primaryMetric,
        current: metric?.value ?? experiment.primaryMetric.current,
        measurementSource: metric?.source ?? experiment.measurementSource,
      },
    })
    await createPersistedLearning({
      user,
      experimentId,
      outcome,
      learning,
      metrics: state.metricSnapshots,
    })
  }

  return {
    ok: true,
    decision,
    learning,
  }
}
