import type {
  Diagnostic,
  Evidence,
  EventMappingRow,
  Experiment,
  FunnelStep,
  Learning,
  Metric,
} from "./types"
import { connectorCatalog } from "@/lib/connectors/catalog"
import { gatewayProfileCatalog } from "@/lib/gateway/catalog"

export const workspace = {
  name: "myteuf.com",
  slug: "myteuf",
  team: "Équipe produit",
  plan: "Local",
}

export const project = {
  id: "prj_myteuf",
  name: "myteuf.com",
  websiteUrl: "https://myteuf.com",
  description: "Projet à analyser. Les données réelles doivent être synchronisées depuis votre source connectée.",
  productType: "À préciser",
  businessModel: "À préciser",
  stage: "À préciser",
  targetSegment: "À préciser",
  primaryUser: "À préciser",
  problem: "À préciser",
  buyingTrigger: "À préciser",
  currentAlternative: "À préciser",
  valueProposition: "À préciser",
  pricing: "À préciser",
  activationDefinition: "À définir après inspection des événements réels de votre source.",
}

export const connectors = connectorCatalog

export const gatewayProfiles = gatewayProfileCatalog

export const eventMappings: EventMappingRow[] = []

export const funnel: FunnelStep[] = []

export const metrics: Metric[] = []

export const evidence: Evidence[] = []

export const diagnostic: Diagnostic = {
  status: "insufficient",
  version: "V0",
  createdAt: "",
  summary:
    "Diagnostic non disponible : aucune source réelle n'a encore été synchronisée pour ce projet.",
  confidenceScore: 0,
  completenessScore: 0,
  dataQualityScore: 0,
  proposedBottleneck: "unknown",
  confirmedBottleneck: null,
  bottleneckRationale:
    "Proof Engine doit d'abord lire votre source connectée, détecter les événements disponibles et créer un mapping vérifiable.",
  bottleneckEvidenceIds: [],
  facts: [],
  signals: [],
  assumptions: [],
  missingEvidence: [
    {
      question: "Quels événements existent déjà dans votre source ?",
      reason: "Aucune source n'a encore été connectée ni inspectée.",
    },
    {
      question: "Quelle métrique doit représenter l'activation ?",
      reason: "La définition dépendra des événements réellement disponibles.",
    },
  ],
  nextBestAction: "Connecter une source (Postgres, Supabase, Firebase, REST, webhook ou Stripe) en lecture seule puis inspecter les données et événements existants.",
  warnings: ["Aucun calcul n'est produit tant qu'aucune donnée réelle n'est synchronisée."],
  model: "mock-ai-provider",
  promptVersion: "diagnostic@empty",
}

export const experiments: Experiment[] = []

export const learnings: Learning[] = []

export const onboardingState = {
  completedSteps: 1,
  totalSteps: 6,
}
