import type {
  BottleneckType,
  ConnectorProvider,
  ConnectorStatus,
  EvidenceClassification,
  EvidenceSourceKind,
  ExperimentStatus,
  Freshness,
  GatewayProvider,
} from "./types"

export const connectorProviderLabel: Record<ConnectorProvider, string> = {
  postgres: "PostgreSQL (Neon, serveur, RDS…)",
  supabase_postgres: "Supabase",
  firebase_firestore: "Firebase / Firestore",
  rest_api: "Endpoint REST",
  webhook_events: "Webhook / collecteur d'événements",
  stripe_readonly: "Stripe (read-only)",
}

export const connectorStatusLabel: Record<ConnectorStatus, string> = {
  connected: "Connecté",
  syncing: "Synchronisation…",
  error: "Erreur",
  not_connected: "Non connecté",
}

export const gatewayProviderLabel: Record<GatewayProvider, string> = {
  mock_gateway: "Gateway mock",
  http_gateway: "Gateway HTTP",
  mcp_gateway: "Gateway MCP",
  codex_mcp_gateway: "Codex MCP Gateway",
  hermes_style_gateway: "Hermes-style Gateway",
}

export const classificationLabel: Record<EvidenceClassification, string> = {
  fact: "Fait",
  signal: "Signal",
  assumption: "Hypothèse",
  unknown: "Inconnue",
}

export const sourceKindLabel: Record<EvidenceSourceKind, string> = {
  backend_event: "Événement backend",
  computed_metric: "Métrique calculée",
  funnel_dropoff: "Rupture de tunnel",
  retention_signal: "Signal de rétention",
  payment_signal: "Signal de paiement",
  customer_feedback_table: "Retour client",
  founder_annotation: "Annotation fondateur",
}

export const freshnessLabel: Record<Freshness, string> = {
  fresh: "À jour",
  recent: "Récent",
  stale: "Obsolète",
}

export const experimentStatusLabel: Record<ExperimentStatus, string> = {
  draft: "Brouillon",
  ready: "Prête",
  running: "En cours",
  completed: "Terminée",
  abandoned: "Abandonnée",
}

export const bottleneckLabel: Record<BottleneckType, string> = {
  acquisition: "Acquisition",
  positioning_offer: "Positionnement / offre",
  conversion: "Conversion",
  activation: "Activation",
  retention: "Rétention",
  unknown: "Indéterminé",
}

export const assetTypeLabel = {
  landing_page: "Landing page",
  cold_email: "Cold email",
  interview_script: "Script d'entretien",
} as const

type Tone = "default" | "secondary" | "outline" | "destructive" | "success" | "warning"

export const classificationTone: Record<EvidenceClassification, Tone> = {
  fact: "success",
  signal: "default",
  assumption: "warning",
  unknown: "outline",
}

export const statusTone: Record<ConnectorStatus, Tone> = {
  connected: "success",
  syncing: "default",
  error: "destructive",
  not_connected: "outline",
}

export const experimentStatusTone: Record<ExperimentStatus, Tone> = {
  draft: "outline",
  ready: "default",
  running: "warning",
  completed: "success",
  abandoned: "destructive",
}

export const freshnessTone: Record<Freshness, Tone> = {
  fresh: "success",
  recent: "default",
  stale: "warning",
}
