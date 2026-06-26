import type { EvidenceItem } from "@/lib/analytics/metrics"
import type { MetricSnapshot } from "@/lib/connectors/schemas"
import {
  diagnosticOutputSchema,
  experimentPlanOutputSchema,
  learningOutputSchema,
  type DiagnosticOutput,
  type ExperimentPlanOutput,
  type LearningOutput,
} from "@/lib/ai/schemas"
import { validateEvidenceIds } from "@/lib/diagnostics/scoring"

export interface AIProvider {
  generateDiagnostic(input: { evidence: EvidenceItem[]; metrics: MetricSnapshot[]; confidenceScore: number }): Promise<DiagnosticOutput>
  generateExperiment(input: { diagnostic: DiagnosticOutput; metrics: MetricSnapshot[] }): Promise<ExperimentPlanOutput>
  generateLearning(input: { experimentTitle: string; outcome: "validated" | "invalidated" | "inconclusive"; evidence: EvidenceItem[] }): Promise<LearningOutput>
}

export class MockAIProvider implements AIProvider {
  async generateDiagnostic(input: { evidence: EvidenceItem[]; metrics: MetricSnapshot[]; confidenceScore: number }) {
    const facts = input.evidence.filter((item) => item.classification === "fact")
    const signals = input.evidence.filter((item) => item.classification === "signal")
    const unknowns = input.evidence.filter((item) => item.classification === "unknown")
    const shareRate = input.metrics.find((metric) => metric.key === "share_rate")
    const photoRate = input.metrics.find((metric) => metric.key === "first_photo_rate")
    const sufficient = facts.length >= 3 && input.confidenceScore >= 45

    const output = diagnosticOutputSchema.parse({
      status: sufficient ? "sufficient" : "insufficient",
      summary: sufficient
        ? "Le blocage prioritaire se situe entre la creation de l'evenement et son partage. Les donnees aval montrent que les invites contribuent lorsque le lien circule."
        : "Données insuffisantes pour produire un diagnostic fiable.",
      facts: facts.slice(0, 3).map((item) => ({ statement: item.title, evidenceIds: [item.id] })),
      signals: signals.slice(0, 2).map((item) => ({ statement: item.title, evidenceIds: [item.id] })),
      assumptions: [],
      bottleneck: {
        type: sufficient ? "activation" : "unknown",
        rationale: sufficient
          ? `Le taux de partage (${shareRate?.value ?? "n/a"} %) precede un taux de premiere photo de ${photoRate?.value ?? "n/a"} %.`
          : "Le data quality gate ou la couverture de preuves ne suffit pas.",
        evidenceIds: facts.slice(0, 3).map((item) => item.id),
      },
      missingEvidence: unknowns.map((item) => ({ question: item.title, reason: item.content })),
      nextBestAction: sufficient
        ? "Tester un parcours de partage guide immediatement apres la creation de l'evenement."
        : "Connecter une source et synchroniser les evenements principaux avant de relancer l'analyse.",
      warnings: ["Comparaison non randomisee : la causalite reste incertaine."],
    })

    const validation = validateEvidenceIds(output, input.evidence)
    if (!validation.ok) throw new Error(`Unknown evidence IDs: ${validation.unknown.join(", ")}`)
    return output
  }

  async generateExperiment(input: { diagnostic: DiagnosticOutput; metrics: MetricSnapshot[] }) {
    const firstPhoto = input.metrics.find((metric) => metric.key === "first_photo_rate")
    const output = experimentPlanOutputSchema.parse({
      title: "Action de partage apres creation",
      hypothesis: "Si l'organisateur est guide juste apres la creation, davantage d'evenements recevront une premiere photo sous 24 h.",
      targetSegment: "Nouveaux organisateurs ayant termine la creation d'un evenement",
      problem: input.diagnostic.summary,
      channel: "Produit",
      offer: "Ecran post-creation avec message de partage, copie du lien, QR code et apercu invite.",
      valueProposition: "Inviter ses proches a ajouter leurs photos sans friction.",
      rationale: input.diagnostic.bottleneck.rationale,
      primaryMetric: {
        key: "first_photo_rate",
        name: firstPhoto?.name ?? "Premiere photo",
        unit: firstPhoto?.unit ?? "%",
        baseline: firstPhoto?.value ?? null,
        target: firstPhoto?.targetValue ?? null,
        targetIsHypothesis: true,
        direction: "increase",
      },
      guardrailMetrics: [
        { key: "events_created", name: "Evenements crees", unit: "evenements" },
        { key: "guest_join_rate", name: "Taux d'arrivee invites", unit: "%" },
      ],
      durationDays: 14,
      estimatedBudget: 0,
      steps: [
        { order: 1, title: "Remplacer l'ecran de confirmation", description: "Afficher les actions de partage utiles sans saisie de metrique." },
        { order: 2, title: "Ajouter l'apercu invite", description: "Rassurer l'organisateur sur l'experience des invites." },
        { order: 3, title: "Declencher le suivi", description: "Mesurer automatiquement la premiere photo sous 24 h." },
      ],
      decisionRules: {
        continue: "Continuer si la premiere photo sous 24 h augmente sans degrader la creation.",
        iterate: "Modifier si l'effet depend du canal ou du type d'evenement.",
        stop: "Arreter si aucune progression n'apparait ou si un guardrail se degrade.",
      },
      requiredAssets: ["landing_page", "interview_script"],
      evidenceIds: input.diagnostic.bottleneck.evidenceIds,
      risks: ["La comparaison avant/apres ne prouve pas seule la causalite."],
    })

    return output
  }

  async generateLearning(input: { experimentTitle: string; outcome: "validated" | "invalidated" | "inconclusive"; evidence: EvidenceItem[] }) {
    return learningOutputSchema.parse({
      outcome: input.outcome,
      observedResult:
        input.outcome === "validated"
          ? "La metrique principale progresse au-dessus de la cible synchronisee."
          : input.outcome === "invalidated"
            ? "La metrique principale ne progresse pas dans la direction attendue."
            : "Les donnees synchronisees ne suffisent pas encore pour conclure.",
      supportedFindings: ["Le partage est une etape critique de l'activation organisateur."],
      rejectedFindings: input.outcome === "invalidated" ? ["Le changement teste ne suffit pas a augmenter l'activation."] : [],
      unresolvedQuestions: ["L'effet varie-t-il selon le type d'evenement ?"],
      reusableLearnings: [`Experience analysee: ${input.experimentTitle}.`],
      nextRecommendation: "Segmenter les resultats par canal de partage avant la prochaine experience.",
      evidenceIds: input.evidence.slice(0, 3).map((item) => item.id),
    })
  }
}
