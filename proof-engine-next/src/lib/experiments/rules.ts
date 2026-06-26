import type { Experiment } from "@/lib/mock/types"

export function assertSingleRunningExperiment(experiments: Pick<Experiment, "id" | "status">[], nextExperimentId: string) {
  const running = experiments.filter((experiment) => experiment.status === "running" && experiment.id !== nextExperimentId)
  if (running.length > 0) {
    return {
      ok: false,
      reason: `Une experience est deja en cours: ${running[0].id}.`,
    }
  }
  return { ok: true, reason: null }
}

export function applyExperimentStartRule(experiments: Pick<Experiment, "id" | "status">[], nextExperimentId: string) {
  const single = assertSingleRunningExperiment(experiments, nextExperimentId)
  if (!single.ok) return single
  const target = experiments.find((experiment) => experiment.id === nextExperimentId)
  if (!target) return { ok: false, reason: "Experience inconnue." }
  if (!["ready", "draft"].includes(target.status)) {
    return { ok: false, reason: "Seule une experience prete ou brouillon peut etre demarree." }
  }
  return { ok: true, reason: null }
}
