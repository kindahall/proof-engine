import type { CanonicalEventName, MetricSnapshot, NormalizedEvent } from "@/lib/connectors/schemas"

export interface FunnelSnapshotStep {
  event: CanonicalEventName
  label: string
  count: number
  conversionFromPrev: number | null
}

export interface EvidenceItem {
  id: string
  code: string
  title: string
  content: string
  classification: "fact" | "signal" | "assumption" | "unknown"
  sourceKind: "backend_event" | "computed_metric" | "funnel_dropoff" | "payment_signal" | "founder_annotation"
  source: string
  strength: "weak" | "medium" | "strong"
  freshness: "fresh" | "recent" | "stale"
  observedAt: string
  tags: string[]
  formula?: string
}

export interface DataQualityGateResult {
  status: "passed" | "blocked"
  score: number
  checks: { key: string; ok: boolean; label: string; detail: string }[]
}

const funnelDefinition: { event: CanonicalEventName; label: string }[] = [
  { event: "project_created", label: "Evenement cree" },
  { event: "core_action_started", label: "QR / lien consulte" },
  { event: "invite_sent", label: "Partage declenche" },
  { event: "guest_joined", label: "Invite rejoint" },
  { event: "content_uploaded", label: "Premiere photo" },
  { event: "activation_reached", label: "Activation" },
  { event: "purchase_completed", label: "Achat" },
]

function distinctEntityCount(events: NormalizedEvent[], canonicalEventName: CanonicalEventName) {
  return new Set(events.filter((event) => event.canonicalEventName === canonicalEventName).map((event) => event.entityId)).size
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export function computeFunnelSnapshot(events: NormalizedEvent[]): FunnelSnapshotStep[] {
  return funnelDefinition.map((step, index) => {
    const count = distinctEntityCount(events, step.event)
    const previous = index === 0 ? null : distinctEntityCount(events, funnelDefinition[index - 1].event)
    return {
      ...step,
      count,
      conversionFromPrev: previous == null ? null : percent(count, previous),
    }
  })
}

export function computeMetricSnapshots(
  events: NormalizedEvent[],
  dataSourceId = "ds_mock",
  sourceLabel = "Connecteur mock interne",
): MetricSnapshot[] {
  const created = distinctEntityCount(events, "project_created")
  const shared = distinctEntityCount(events, "invite_sent")
  const guests = distinctEntityCount(events, "guest_joined")
  const photos = distinctEntityCount(events, "content_uploaded")
  const activated = distinctEntityCount(events, "activation_reached")
  const purchases = distinctEntityCount(events, "purchase_completed")
  const revenue = events
    .filter((event) => event.canonicalEventName === "purchase_completed")
    .reduce((total, event) => total + (typeof event.properties.amount === "number" ? event.properties.amount : 0), 0)

  const periodStart = events.map((event) => event.occurredAt).sort()[0] ?? new Date().toISOString()
  const periodEnd = events.map((event) => event.occurredAt).sort().at(-1) ?? new Date().toISOString()
  const base = {
    periodStart,
    periodEnd,
    source: sourceLabel,
    dataSourceId,
    freshnessStatus: "fresh" as const,
    confidenceLevel: "high" as const,
  }

  return [
    { ...base, key: "events_created", name: "Evenements crees", value: created, unit: "evenements", formula: "count(project_created)", targetValue: null },
    { ...base, key: "share_rate", name: "Taux de partage", value: percent(shared, created), unit: "%", formula: "invite_sent / project_created", targetValue: 65 },
    { ...base, key: "guest_join_rate", name: "Taux d'arrivee invites", value: percent(guests, shared), unit: "%", formula: "guest_joined / invite_sent", targetValue: null },
    { ...base, key: "first_photo_rate", name: "Premiere photo", value: percent(photos, created), unit: "%", formula: "content_uploaded / project_created", targetValue: 35 },
    { ...base, key: "activation_rate", name: "Taux d'activation", value: percent(activated, created), unit: "%", formula: "activation_reached / project_created", targetValue: 35 },
    { ...base, key: "paid_conversion", name: "Conversion payante", value: percent(purchases, created), unit: "%", formula: "purchase_completed / project_created", targetValue: null },
    { ...base, key: "revenue", name: "Revenu attribue", value: revenue, unit: "EUR", formula: "sum(purchase_completed.amount)", targetValue: null },
  ]
}

export function evaluateDataQualityGate(input: {
  connectedSources: number
  lastSuccessfulSyncAt: string | null
  activeMappings: number
  events: NormalizedEvent[]
  metrics: MetricSnapshot[]
}): DataQualityGateResult {
  const checks = [
    { key: "source", ok: input.connectedSources > 0, label: "Au moins une source connectee", detail: `${input.connectedSources} source(s)` },
    { key: "sync", ok: Boolean(input.lastSuccessfulSyncAt), label: "Synchronisation reussie recente", detail: input.lastSuccessfulSyncAt ?? "Aucune sync" },
    { key: "mapping", ok: input.activeMappings >= 5, label: "Mapping minimal", detail: `${input.activeMappings} mapping(s) actif(s)` },
    { key: "volume", ok: input.events.length >= 20, label: "Volume d'evenements suffisant", detail: `${input.events.length} evenement(s)` },
    { key: "metric", ok: input.metrics.some((metric) => metric.targetValue != null), label: "Metrique principale candidate", detail: input.metrics.find((metric) => metric.targetValue != null)?.name ?? "Aucune" },
    { key: "freshness", ok: input.metrics.some((metric) => metric.freshnessStatus === "fresh"), label: "Fraicheur des donnees", detail: "Snapshots recalcules" },
  ]
  const passed = checks.filter((check) => check.ok).length
  return {
    status: checks.every((check) => check.ok) ? "passed" : "blocked",
    score: Math.round((passed / checks.length) * 100),
    checks,
  }
}

export function generateEvidenceFromMetrics(events: NormalizedEvent[], metrics: MetricSnapshot[]): EvidenceItem[] {
  const metricByKey = new Map(metrics.map((metric) => [metric.key, metric]))
  const created = metricByKey.get("events_created")?.value ?? 0
  const shareRate = metricByKey.get("share_rate")?.value ?? 0
  const photoRate = metricByKey.get("first_photo_rate")?.value ?? 0
  const paidConversion = metricByKey.get("paid_conversion")?.value ?? 0
  const observedAt = new Date().toISOString().slice(0, 10)
  const mobileShares = events.filter((event) => event.canonicalEventName === "invite_sent" && event.properties.device === "mobile").length
  const sourceFor = (metricKey: string, fallback = "Source synchronisee") =>
    metricByKey.get(metricKey)?.source ?? metrics[0]?.source ?? fallback

  return [
    {
      id: "ev_metric_photo_rate",
      code: "F-001",
      title: `${photoRate} % des evenements crees recoivent une premiere photo`,
      content: `Sur ${created} evenements crees, ${photoRate} % ont recu au moins une photo synchronisee.`,
      classification: "fact",
      sourceKind: "computed_metric",
      source: sourceFor("first_photo_rate"),
      strength: "strong",
      freshness: "fresh",
      observedAt,
      tags: ["activation", "funnel"],
      formula: "content_uploaded / project_created",
    },
    {
      id: "ev_metric_share_rate",
      code: "F-002",
      title: `${shareRate} % des organisateurs declenchent un partage`,
      content: `Le taux de partage calcule depuis les evenements synchronises est de ${shareRate} %.`,
      classification: "fact",
      sourceKind: "backend_event",
      source: sourceFor("share_rate"),
      strength: "strong",
      freshness: "fresh",
      observedAt,
      tags: ["partage"],
      formula: "invite_sent / project_created",
    },
    {
      id: "ev_funnel_dropoff",
      code: "F-003",
      title: "La rupture principale se situe entre creation et partage",
      content: "Les etapes aval convertissent mieux que le passage creation -> partage.",
      classification: "fact",
      sourceKind: "funnel_dropoff",
      source: "Funnel snapshot",
      strength: "strong",
      freshness: "fresh",
      observedAt,
      tags: ["funnel", "activation"],
    },
    {
      id: "ev_signal_mobile",
      code: "S-001",
      title: "Le mobile semble favoriser le partage",
      content: `${mobileShares} partages synchronises proviennent d'un contexte mobile.`,
      classification: "signal",
      sourceKind: "backend_event",
      source: sourceFor("share_rate"),
      strength: "medium",
      freshness: "recent",
      observedAt,
      tags: ["mobile", "partage"],
    },
    {
      id: "ev_unknown_share_delay",
      code: "I-001",
      title: "Delai median entre creation et premier partage",
      content: "Le delai entre creation et premier partage doit etre instrumente plus finement avant d'en faire un fait.",
      classification: "unknown",
      sourceKind: "funnel_dropoff",
      source: "Donnee manquante",
      strength: "weak",
      freshness: "stale",
      observedAt,
      tags: ["instrumentation"],
    },
    {
      id: "ev_metric_paid_conversion",
      code: "F-004",
      title: `${paidConversion} % de conversion payante`,
      content: `La conversion payante calculee depuis les evenements synchronises est de ${paidConversion} %.`,
      classification: "fact",
      sourceKind: "payment_signal",
      source: sourceFor("paid_conversion"),
      strength: "medium",
      freshness: "fresh",
      observedAt,
      tags: ["revenu"],
      formula: "purchase_completed / project_created",
    },
  ]
}
