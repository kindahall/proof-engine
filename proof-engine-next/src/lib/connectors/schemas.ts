import { z } from "zod"

export const connectorProviderSchema = z.enum([
  "postgres",
  "supabase_postgres",
  "firebase_firestore",
  "rest_api",
  "webhook_events",
  "stripe_readonly",
])

export const connectorStatusSchema = z.enum(["connected", "syncing", "error", "not_connected"])

export const gatewayProviderKindSchema = z.enum([
  "mock_gateway",
  "http_gateway",
  "mcp_gateway",
  "codex_mcp_gateway",
  "hermes_style_gateway",
])

export const gatewayCapabilitySchema = z.enum([
  "schema.inspect",
  "events.read",
  "entities.read",
  "metrics.read",
  "funnels.compute",
  "cohorts.compute",
  "revenue.read",
  "experiments.read",
  "logs.read",
  "health.check",
])

export const forbiddenGatewayCapabilitySchema = z.enum([
  "data.write",
  "data.delete",
  "campaign.send",
  "email.send",
  "payment.modify",
  "backend.mutate",
])

export const canonicalEventSchema = z.enum([
  "landing_viewed",
  "signup_started",
  "signup_completed",
  "project_created",
  "core_action_started",
  "core_action_completed",
  "invite_sent",
  "shared_link_clicked",
  "guest_joined",
  "content_uploaded",
  "activation_reached",
  "checkout_started",
  "purchase_completed",
  "subscription_started",
  "subscription_cancelled",
  "second_project_created",
  "referral_created",
])

export const sourceEventSchema = z.object({
  externalId: z.string().min(1),
  eventName: z.string().min(1),
  occurredAt: z.string().min(1),
  actorId: z.string().min(1),
  actorType: z.enum(["organizer", "guest", "system"]),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).default({}),
})

export const ingestEventSchema = z.object({
  eventName: z.string().min(1),
  occurredAt: z.string().min(1),
  actorId: z.string().min(1),
  actorType: z.enum(["organizer", "guest", "system"]),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).default({}),
})

export const normalizedEventSchema = sourceEventSchema.extend({
  canonicalEventName: canonicalEventSchema.nullable(),
  dataSourceId: z.string().min(1),
  hash: z.string().min(16),
  receivedAt: z.string().min(1),
})

export const eventMappingSchema = z.object({
  sourceEventName: z.string().min(1),
  canonicalEventName: canonicalEventSchema,
  actorType: z.enum(["organizer", "guest", "system"]),
  entityType: z.string().min(1),
  funnelStage: z.string().min(1),
  isActive: z.boolean(),
  version: z.number().int().positive(),
})

export const gatewayProfileSchema = z.object({
  id: z.string().min(1),
  provider: gatewayProviderKindSchema,
  name: z.string().min(1),
  transport: z.enum(["http", "mcp"]),
  mode: z.literal("read_only"),
  endpoint: z.string().min(1),
  capabilities: z.array(gatewayCapabilitySchema),
  scopes: z.array(z.string().min(1)),
})

export const gatewayConnectionInputSchema = z.object({
  provider: gatewayProviderKindSchema.optional(),
  name: z.string().min(1).optional(),
  transport: z.enum(["http", "mcp"]).optional(),
  endpoint: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
})

export const gatewayHealthResultSchema = z.object({
  ok: z.boolean(),
  status: z.enum(["healthy", "degraded", "blocked"]),
  latencyMs: z.number().nonnegative(),
  message: z.string(),
  capabilities: z.array(gatewayCapabilitySchema),
  forbiddenCapabilities: z.array(z.string()).default([]),
})

export const gatewaySchemaResultSchema = z.object({
  sourceId: z.string(),
  objects: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(["table", "collection", "endpoint", "stream"]),
      fields: z.array(z.object({ name: z.string(), type: z.string(), nullable: z.boolean() })),
      sampleSize: z.number().int().nonnegative(),
    }),
  ),
})

export const metricSnapshotSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  source: z.string(),
  dataSourceId: z.string(),
  formula: z.string(),
  freshnessStatus: z.enum(["fresh", "recent", "stale"]),
  confidenceLevel: z.enum(["low", "medium", "high"]),
  targetValue: z.number().nullable(),
})

export type ConnectorProvider = z.infer<typeof connectorProviderSchema>
export type GatewayProviderKind = z.infer<typeof gatewayProviderKindSchema>
export type GatewayCapability = z.infer<typeof gatewayCapabilitySchema>
export type CanonicalEventName = z.infer<typeof canonicalEventSchema>
export type SourceEvent = z.infer<typeof sourceEventSchema>
export type IngestEvent = z.infer<typeof ingestEventSchema>
export type NormalizedEvent = z.infer<typeof normalizedEventSchema>
export type EventMapping = z.infer<typeof eventMappingSchema>
export type GatewayProfileConfig = z.infer<typeof gatewayProfileSchema>
export type GatewayHealthResult = z.infer<typeof gatewayHealthResultSchema>
export type GatewaySchemaResult = z.infer<typeof gatewaySchemaResultSchema>
export type MetricSnapshot = z.infer<typeof metricSnapshotSchema>
