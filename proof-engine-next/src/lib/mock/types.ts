// Frontend mock types. Mirrors the spec's data model at a UI-relevant level.
// No real backend: these describe the shape of representative demo data.

export type ConnectorProvider =
  | "postgres"
  | "supabase_postgres"
  | "firebase_firestore"
  | "rest_api"
  | "webhook_events"
  | "stripe_readonly"

export type ConnectorStatus = "connected" | "syncing" | "error" | "not_connected"

export interface Connector {
  id: string
  provider: ConnectorProvider
  name: string
  status: ConnectorStatus
  syncMode: "scheduled" | "incremental" | "manual"
  lastSyncAt: string | null
  nextSyncAt: string | null
  lastError: string | null
  recordsSynced: number
  permissions: string[]
}

export type GatewayProvider =
  | "mock_gateway"
  | "http_gateway"
  | "mcp_gateway"
  | "codex_mcp_gateway"
  | "hermes_style_gateway"

export type GatewayCapability =
  | "schema.inspect"
  | "events.read"
  | "entities.read"
  | "metrics.read"
  | "funnels.compute"
  | "cohorts.compute"
  | "revenue.read"
  | "experiments.read"
  | "logs.read"
  | "health.check"

export interface GatewayProfile {
  id: string
  provider: GatewayProvider
  name: string
  transport: "mcp" | "http"
  mode: "read_only"
  endpoint: string
  status: ConnectorStatus
  capabilities: GatewayCapability[]
  scopes: string[]
  lastHealthCheckAt: string | null
}

export type CanonicalEvent =
  | "landing_viewed"
  | "signup_started"
  | "signup_completed"
  | "project_created"
  | "core_action_started"
  | "core_action_completed"
  | "invite_sent"
  | "shared_link_clicked"
  | "guest_joined"
  | "content_uploaded"
  | "activation_reached"
  | "checkout_started"
  | "purchase_completed"
  | "subscription_started"
  | "subscription_cancelled"
  | "second_project_created"
  | "referral_created"

export interface EventMappingRow {
  id: string
  sourceEvent: string
  canonicalEvent: CanonicalEvent
  actorType: "organizer" | "guest" | "system"
  entityType: string
  funnelStage: string
  active: boolean
  version: number
}

export type Freshness = "fresh" | "recent" | "stale"

export interface Metric {
  key: string
  name: string
  value: number
  unit: string
  periodLabel: string
  source: string
  freshness: Freshness
  confidence: "low" | "medium" | "high"
  formula: string
  target: number | null
}

export interface FunnelStep {
  event: CanonicalEvent
  label: string
  count: number
  conversionFromPrev: number | null
}

export type EvidenceClassification = "fact" | "signal" | "assumption" | "unknown"
export type EvidenceSourceKind =
  | "backend_event"
  | "computed_metric"
  | "funnel_dropoff"
  | "retention_signal"
  | "payment_signal"
  | "customer_feedback_table"
  | "founder_annotation"
export type EvidenceStrength = "weak" | "medium" | "strong"

export interface Evidence {
  id: string
  code: string // F-001, S-001, H-001, I-001
  title: string
  content: string
  classification: EvidenceClassification
  sourceKind: EvidenceSourceKind
  source: string
  strength: EvidenceStrength
  freshness: Freshness
  observedAt: string
  tags: string[]
  formula?: string
}

export type BottleneckType =
  | "acquisition"
  | "positioning_offer"
  | "conversion"
  | "activation"
  | "retention"
  | "unknown"

export interface Diagnostic {
  status: "sufficient" | "insufficient"
  version: string
  createdAt: string
  summary: string
  confidenceScore: number
  completenessScore: number
  dataQualityScore: number
  proposedBottleneck: BottleneckType
  confirmedBottleneck: BottleneckType | null
  bottleneckRationale: string
  bottleneckEvidenceIds: string[]
  facts: { statement: string; evidenceIds: string[] }[]
  signals: { statement: string; evidenceIds: string[] }[]
  assumptions: { statement: string; evidenceIds: string[] }[]
  missingEvidence: { question: string; reason: string }[]
  nextBestAction: string
  warnings: string[]
  model: string
  promptVersion: string
}

export type ExperimentStatus = "draft" | "ready" | "running" | "completed" | "abandoned"
export type AssetType = "landing_page" | "cold_email" | "interview_script"

export interface ExperimentAsset {
  type: AssetType
  generated: boolean
}

export interface ExperimentMetricPoint {
  day: string
  value: number
  baseline: number
}

export interface Experiment {
  id: string
  title: string
  status: ExperimentStatus
  hypothesis: string
  targetSegment: string
  problem: string
  channel: string
  offer: string
  valueProposition: string
  rationale: string
  primaryMetric: {
    key: string
    name: string
    unit: string
    baseline: number | null
    target: number | null
    targetIsHypothesis: boolean
    direction: "increase" | "decrease"
    current: number | null
  }
  guardrailMetrics: { key: string; name: string; unit: string; value: number | null }[]
  durationDays: number
  daysElapsed: number
  estimatedBudget: number | null
  steps: { order: number; title: string; description: string }[]
  decisionRules: { continue: string; iterate: string; stop: string }
  requiredAssets: AssetType[]
  assets: ExperimentAsset[]
  evidenceIds: string[]
  risks: string[]
  measurementSource: string | null
  series: ExperimentMetricPoint[]
  notes: { author: string; text: string; date: string }[]
  abandonReason?: string
}

export interface Learning {
  id: string
  experimentId: string
  experimentTitle: string
  outcome: "validated" | "invalidated" | "inconclusive"
  observedResult: string
  delta: string
  supportedFindings: string[]
  rejectedFindings: string[]
  unresolvedQuestions: string[]
  nextRecommendation: string
  causalityNote: string | null
  date: string
}
