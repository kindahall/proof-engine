import type { User } from "@supabase/supabase-js"
import { aiConfig } from "@/config/ai"
import type { DiagnosticOutput, ExperimentPlanOutput, LearningOutput } from "@/lib/ai/schemas"
import type {
  ConnectorProvider,
  GatewayCapability,
  GatewayProviderKind,
  MetricSnapshot,
  NormalizedEvent,
  SourceEvent,
} from "@/lib/connectors/schemas"
import { normalizeSourceEvent, type RuntimeState, type RuntimeSyncRun } from "@/lib/runtime/store"
import { computeMetricSnapshots, generateEvidenceFromMetrics } from "@/lib/analytics/metrics"
import type { EvidenceItem } from "@/lib/analytics/metrics"
import type {
  AssetType,
  EventMappingRow,
  Evidence,
  Experiment,
  ExperimentMetricPoint,
  GatewayProfile,
  Learning,
} from "@/lib/mock/types"
import { encryptSecret, decryptSecret } from "@/lib/security/encryption"
import { createSupabaseAdminClient } from "@/lib/supabase/server"

export interface WorkspaceContext {
  userId: string
  workspaceId: string
  workspaceSlug: string
  workspaceName?: string
  workspacePlan?: string
  projectId: string
  projectName?: string
  projectWebsiteUrl?: string | null
}

export interface PersistedConnector {
  id: string
  workspaceId: string
  projectId: string
  provider: ConnectorProvider
  name: string
  status: "connected" | "syncing" | "error" | "not_connected"
  syncMode: "scheduled" | "incremental" | "manual"
  config: Record<string, unknown>
  lastSuccessfulSyncAt: string | null
  lastFailedSyncAt: string | null
  lastError: string | null
  recordsSynced: number
}

export interface LoadedPersistedConnector {
  context: WorkspaceContext
  connector: PersistedConnector
}

export interface WorkspaceSettings {
  name: string
  slug: string
  plan: string
}

export interface ProjectSettings {
  name: string
  websiteUrl: string
  description: string
  productType: string
  businessModel: string
  stage: string
  targetSegment: string
  primaryUser: string
  problem: string
  buyingTrigger: string
  currentAlternative: string
  valueProposition: string
  pricing: string
  activationDefinition: string
}

export interface WorkspaceMemberSettings {
  name: string
  role: string
}

export interface PersistedDiagnosticExport {
  id: string
  status: string
  proposedBottleneck: string
  confirmedBottleneck: string | null
  confidenceScore: number
  completenessScore: number
  dataQualityScore: number
  evidenceIds: string[]
  dataSourceIds: string[]
  structuredOutput: Record<string, unknown> | null
  model: string
  promptVersion: string
  createdAt: string
}

export class WorkspaceSlugTakenError extends Error {
  constructor(slug: string) {
    super(`Le slug "${slug}" est déjà utilisé.`)
    this.name = "WorkspaceSlugTakenError"
  }
}

export interface ConnectorSecretPayload {
  provider: ConnectorProvider
  connectionString?: string
  endpoint?: string
  token?: string
  serviceAccountJson?: string
  signingSecret?: string
  savedAt: string
}

export interface GatewaySecretPayload {
  provider: GatewayProviderKind
  endpoint?: string
  token?: string
  savedAt: string
}

export interface SaveConnectorInput {
  user: Pick<User, "id" | "email" | "user_metadata">
  provider: ConnectorProvider
  name: string
  endpoint?: string
  secret?: string
  eventsTable?: string
}

export interface SaveGatewayInput {
  user: Pick<User, "id" | "email" | "user_metadata">
  provider: GatewayProviderKind
  name: string
  transport: "http" | "mcp"
  endpoint: string
  token?: string
  capabilities?: GatewayCapability[]
  scopes?: string[]
}

const providerShortcuts: Partial<Record<string, ConnectorProvider>> = {
  ds_postgres: "postgres",
  ds_supabase: "supabase_postgres",
  ds_firebase: "firebase_firestore",
  ds_rest: "rest_api",
  ds_webhook: "webhook_events",
  ds_stripe: "stripe_readonly",
}

function assertNoError(error: { message: string } | null | undefined) {
  if (error) throw new Error(error.message)
}

function requireData<T>(data: T | null, message: string): T {
  if (data == null) throw new Error(message)
  return data
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value != null ? (value as Record<string, unknown>) : {}
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function nullableNumber(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? trimmed : null
}

function defaultSyncMode(provider: ConnectorProvider): PersistedConnector["syncMode"] {
  return provider === "webhook_events" ? "incremental" : "scheduled"
}

function displayNameFromUser(user: Pick<User, "email" | "user_metadata">) {
  const fullName = user.user_metadata?.full_name
  return typeof fullName === "string" && fullName.trim() ? fullName.trim() : user.email ?? "Utilisateur Proof Engine"
}

function workspaceContext(input: {
  userId: string
  workspace: Record<string, unknown>
  project: Record<string, unknown>
}): WorkspaceContext {
  return {
    userId: input.userId,
    workspaceId: String(input.workspace.id),
    workspaceSlug: String(input.workspace.slug),
    workspaceName: String(input.workspace.name ?? "Workspace"),
    workspacePlan: String(input.workspace.plan ?? "free"),
    projectId: String(input.project.id),
    projectName: String(input.project.name ?? "Projet"),
    projectWebsiteUrl: nullableString(input.project.website_url),
  }
}

async function createUniqueWorkspaceSlug(baseSlug: string) {
  const supabase = createSupabaseAdminClient()
  const cleanBase = baseSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "workspace"
  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? cleanBase : `${cleanBase}-${index + 1}`
    const { data, error } = await supabase.from("workspaces").select("id").eq("slug", candidate).maybeSingle()
    assertNoError(error)
    if (!data) return candidate
  }
  return `${cleanBase}-${Date.now()}`
}

export async function ensureWorkspaceForUser(user: Pick<User, "id" | "email" | "user_metadata">): Promise<WorkspaceContext> {
  const supabase = createSupabaseAdminClient()
  const fullName = displayNameFromUser(user)

  const profile = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  })
  assertNoError(profile.error)

  const membership = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()
  assertNoError(membership.error)

  if (membership.data?.workspace_id) {
    const workspaceResult = await supabase
      .from("workspaces")
      .select("id, slug, name, plan")
      .eq("id", membership.data.workspace_id)
      .single()
    assertNoError(workspaceResult.error)
    const workspace = requireData(workspaceResult.data, "Workspace introuvable.")

    const projectResult = await supabase
      .from("projects")
      .select("id, name, website_url")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    assertNoError(projectResult.error)

    if (projectResult.data?.id) {
      return workspaceContext({ userId: user.id, workspace, project: projectResult.data })
    }

    const createdProject = await supabase
      .from("projects")
      .insert({
        workspace_id: workspace.id,
        name: "myteuf.com",
        website_url: "https://myteuf.com",
        description: "Projet à analyser avec les données réelles de votre source.",
        created_by: user.id,
      })
      .select("id, name, website_url")
      .single()
    assertNoError(createdProject.error)
    const project = requireData(createdProject.data, "Projet impossible à créer.")

    return workspaceContext({ userId: user.id, workspace, project })
  }

  const slug = await createUniqueWorkspaceSlug("myteuf")
  const workspaceResult = await supabase
    .from("workspaces")
    .insert({
      name: "myteuf.com",
      slug,
      owner_id: user.id,
      plan: "free",
    })
    .select("id, slug, name, plan")
    .single()
  assertNoError(workspaceResult.error)
  const workspace = requireData(workspaceResult.data, "Workspace impossible à créer.")

  const memberResult = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  })
  assertNoError(memberResult.error)

  const projectResult = await supabase
    .from("projects")
    .insert({
      workspace_id: workspace.id,
      name: "myteuf.com",
      website_url: "https://myteuf.com",
      description: "Projet à analyser avec les données réelles de votre source.",
      created_by: user.id,
    })
    .select("id, name, website_url")
    .single()
  assertNoError(projectResult.error)
  const project = requireData(projectResult.data, "Projet impossible à créer.")

  return workspaceContext({ userId: user.id, workspace, project })
}

function mapProjectSettings(row: Record<string, unknown>): ProjectSettings {
  return {
    name: String(row.name ?? "Projet"),
    websiteUrl: nullableString(row.website_url) ?? "",
    description: nullableString(row.description) ?? "",
    productType: nullableString(row.product_type) ?? "À préciser",
    businessModel: nullableString(row.business_model) ?? "À préciser",
    stage: nullableString(row.stage) ?? "À préciser",
    targetSegment: nullableString(row.target_segment) ?? "À préciser",
    primaryUser: nullableString(row.primary_user) ?? "À préciser",
    problem: nullableString(row.problem_statement) ?? "À préciser",
    buyingTrigger: nullableString(row.buying_trigger) ?? "À préciser",
    currentAlternative: nullableString(row.current_alternative) ?? "À préciser",
    valueProposition: nullableString(row.value_proposition) ?? "À préciser",
    pricing: nullableString(row.pricing_description) ?? "À préciser",
    activationDefinition:
      nullableString(row.activation_definition) ??
      "À définir après inspection des événements réels de votre source.",
  }
}

export async function loadSettingsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)

  const [workspaceResult, projectResult, membersResult] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name, slug, plan")
      .eq("id", context.workspaceId)
      .single(),
    supabase
      .from("projects")
      .select(
        "name, website_url, description, product_type, business_model, stage, target_segment, primary_user, problem_statement, buying_trigger, current_alternative, value_proposition, pricing_description, activation_definition",
      )
      .eq("id", context.projectId)
      .single(),
    supabase
      .from("workspace_members")
      .select("role, profiles(full_name)")
      .eq("workspace_id", context.workspaceId)
      .order("created_at", { ascending: true }),
  ])

  assertNoError(workspaceResult.error)
  assertNoError(projectResult.error)
  assertNoError(membersResult.error)

  const workspaceRow = requireData(workspaceResult.data, "Workspace introuvable.")
  const projectRow = requireData(projectResult.data, "Projet introuvable.")
  const members = (membersResult.data ?? []).map((row: Record<string, unknown>) => {
    const profile = asRecord(row.profiles)
    return {
      name: nullableString(profile.full_name) ?? "Utilisateur Proof Engine",
      role: String(row.role ?? "viewer"),
    }
  })

  return {
    context,
    workspace: {
      name: String(workspaceRow.name ?? context.workspaceName ?? "Workspace"),
      slug: String(workspaceRow.slug ?? context.workspaceSlug),
      plan: String(workspaceRow.plan ?? context.workspacePlan ?? "free"),
    } satisfies WorkspaceSettings,
    project: mapProjectSettings(projectRow),
    members,
  }
}

export async function updateSettingsForUser(input: {
  user: Pick<User, "id" | "email" | "user_metadata">
  workspace: WorkspaceSettings
  project: ProjectSettings
}) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const nextSlug = input.workspace.slug.trim().toLowerCase()

  if (nextSlug !== context.workspaceSlug) {
    const conflict = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", nextSlug)
      .neq("id", context.workspaceId)
      .limit(1)
      .maybeSingle()
    assertNoError(conflict.error)
    if (conflict.data) throw new WorkspaceSlugTakenError(nextSlug)
  }

  const now = new Date().toISOString()
  const workspaceResult = await supabase
    .from("workspaces")
    .update({
      name: input.workspace.name.trim(),
      slug: nextSlug,
      updated_at: now,
    })
    .eq("id", context.workspaceId)
  assertNoError(workspaceResult.error)

  const projectResult = await supabase
    .from("projects")
    .update({
      name: input.project.name.trim(),
      website_url: blankToNull(input.project.websiteUrl),
      description: blankToNull(input.project.description),
      product_type: blankToNull(input.project.productType),
      business_model: blankToNull(input.project.businessModel),
      stage: blankToNull(input.project.stage),
      target_segment: blankToNull(input.project.targetSegment),
      primary_user: blankToNull(input.project.primaryUser),
      problem_statement: blankToNull(input.project.problem),
      buying_trigger: blankToNull(input.project.buyingTrigger),
      current_alternative: blankToNull(input.project.currentAlternative),
      value_proposition: blankToNull(input.project.valueProposition),
      pricing_description: blankToNull(input.project.pricing),
      activation_definition: blankToNull(input.project.activationDefinition),
      updated_at: now,
    })
    .eq("id", context.projectId)
    .eq("workspace_id", context.workspaceId)
  assertNoError(projectResult.error)

  return loadSettingsForUser(input.user)
}

function publicConnectorConfig(input: SaveConnectorInput) {
  if (input.provider === "postgres" || input.provider === "supabase_postgres") {
    return {
      eventsTable: input.eventsTable?.trim() || "events",
    }
  }
  if (input.provider === "rest_api") {
    return {
      endpoint: input.endpoint?.trim() ?? "",
    }
  }
  if (input.provider === "firebase_firestore") {
    return {
      eventsCollection: input.eventsTable?.trim() || "events",
    }
  }
  return {}
}

function secretPayload(input: SaveConnectorInput): ConnectorSecretPayload {
  const endpoint = input.endpoint?.trim()
  const secret = input.secret?.trim()

  if (input.provider === "postgres" || input.provider === "supabase_postgres") {
    return {
      provider: input.provider,
      connectionString: endpoint || secret,
      savedAt: new Date().toISOString(),
    }
  }

  if (input.provider === "firebase_firestore") {
    return {
      provider: input.provider,
      endpoint,
      serviceAccountJson: secret,
      savedAt: new Date().toISOString(),
    }
  }

  if (input.provider === "webhook_events") {
    return {
      provider: input.provider,
      signingSecret: secret,
      savedAt: new Date().toISOString(),
    }
  }

  return {
    provider: input.provider,
    endpoint,
    token: secret,
    savedAt: new Date().toISOString(),
  }
}

export async function saveConnectorConnection(input: SaveConnectorInput) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const config = publicConnectorConfig(input)
  const now = new Date().toISOString()

  const existing = await supabase
    .from("data_sources")
    .select("id")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .eq("provider", input.provider)
    .limit(1)
    .maybeSingle()
  assertNoError(existing.error)

  const dataSourcePayload = {
    workspace_id: context.workspaceId,
    project_id: context.projectId,
    provider: input.provider,
    name: input.name.trim() || "Source de production",
    status: "not_connected",
    sync_mode: defaultSyncMode(input.provider),
    config,
    last_error: null,
    created_by: input.user.id,
    updated_at: now,
  }

  const dataSourceResult = existing.data?.id
    ? await supabase.from("data_sources").update(dataSourcePayload).eq("id", existing.data.id).select("*").single()
    : await supabase.from("data_sources").insert(dataSourcePayload).select("*").single()
  assertNoError(dataSourceResult.error)

  const encrypted = encryptSecret(secretPayload(input))
  const secretRow = await supabase
    .from("connector_secrets")
    .select("id")
    .eq("data_source_id", dataSourceResult.data.id)
    .limit(1)
    .maybeSingle()
  assertNoError(secretRow.error)

  const secretWrite = secretRow.data?.id
    ? await supabase
        .from("connector_secrets")
        .update({
          encrypted_payload: encrypted.encryptedPayload,
          encryption_key_version: encrypted.keyVersion,
          updated_at: now,
        })
        .eq("id", secretRow.data.id)
    : await supabase.from("connector_secrets").insert({
        workspace_id: context.workspaceId,
        project_id: context.projectId,
        data_source_id: dataSourceResult.data.id,
        encrypted_payload: encrypted.encryptedPayload,
        encryption_key_version: encrypted.keyVersion,
        created_by: input.user.id,
      })
  assertNoError(secretWrite.error)

  return {
    context,
    connector: mapDataSourceRow(dataSourceResult.data),
  }
}

function mapDataSourceRow(row: Record<string, unknown>): PersistedConnector {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    provider: row.provider as ConnectorProvider,
    name: String(row.name),
    status: row.status as PersistedConnector["status"],
    syncMode: row.sync_mode as PersistedConnector["syncMode"],
    config: typeof row.config === "object" && row.config != null ? (row.config as Record<string, unknown>) : {},
    lastSuccessfulSyncAt: typeof row.last_successful_sync_at === "string" ? row.last_successful_sync_at : null,
    lastFailedSyncAt: typeof row.last_failed_sync_at === "string" ? row.last_failed_sync_at : null,
    lastError: typeof row.last_error === "string" ? row.last_error : null,
    recordsSynced: Number(row.records_synced ?? 0),
  }
}

export async function loadConnectorForUser(user: Pick<User, "id" | "email" | "user_metadata">, dataSourceId: string) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const query = supabase
    .from("data_sources")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .limit(1)

  const result = isUuid(dataSourceId)
    ? await query.eq("id", dataSourceId).maybeSingle()
    : providerShortcuts[dataSourceId]
      ? await query.eq("provider", providerShortcuts[dataSourceId]).maybeSingle()
      : await query.eq("id", dataSourceId).maybeSingle()

  assertNoError(result.error)
  if (!result.data) return null
  return { context, connector: mapDataSourceRow(result.data) }
}

export async function listPersistedConnectorsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("data_sources")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: true })
  assertNoError(result.error)

  const connectors = (result.data ?? []).map(mapDataSourceRow)
  if (connectors.length === 0) return connectors

  const statsResult = await supabase
    .from("sync_runs")
    .select("data_source_id, records_inserted")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .eq("status", "success")
    .in("data_source_id", connectors.map((connector) => connector.id))
  assertNoError(statsResult.error)

  const recordsByConnector = new Map<string, number>()
  for (const row of statsResult.data ?? []) {
    const dataSourceId = String(row.data_source_id)
    recordsByConnector.set(
      dataSourceId,
      (recordsByConnector.get(dataSourceId) ?? 0) + Number(row.records_inserted ?? 0),
    )
  }

  return connectors.map((connector) => ({
    ...connector,
    recordsSynced: recordsByConnector.get(connector.id) ?? connector.recordsSynced,
  }))
}

export async function loadActivePersistedConnectors(): Promise<LoadedPersistedConnector[]> {
  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .from("data_sources")
    .select("*, workspaces!inner(slug)")
    .eq("status", "connected")
    .order("updated_at", { ascending: true })
  assertNoError(result.error)

  return (result.data ?? []).map((row: Record<string, unknown>) => {
    const connector = mapDataSourceRow(row)
    return {
      connector,
      context: {
        userId: String(row.created_by ?? ""),
        workspaceId: connector.workspaceId,
        workspaceSlug:
          typeof row.workspaces === "object" && row.workspaces != null && "slug" in row.workspaces
            ? String((row.workspaces as { slug?: unknown }).slug)
            : "workspace",
        projectId: connector.projectId,
      },
    }
  })
}

export async function loadConnectorSecret(dataSourceId: string) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .from("connector_secrets")
    .select("encrypted_payload")
    .eq("data_source_id", dataSourceId)
    .limit(1)
    .maybeSingle()
  assertNoError(result.error)
  if (!result.data?.encrypted_payload) return null
  return decryptSecret<ConnectorSecretPayload>(String(result.data.encrypted_payload))
}

export async function recordConnectorHealth(input: {
  context: WorkspaceContext
  dataSourceId: string
  status: string
  latencyMs: number
  message: string
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase.from("connector_health_checks").insert({
    workspace_id: input.context.workspaceId,
    project_id: input.context.projectId,
    data_source_id: input.dataSourceId,
    status: input.status,
    latency_ms: input.latencyMs,
    message: input.message,
  })
  assertNoError(result.error)
}

export async function updateConnectorStatus(input: {
  dataSourceId: string
  status: PersistedConnector["status"]
  lastError?: string | null
  lastSuccessfulSyncAt?: string | null
  lastFailedSyncAt?: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const patch: Record<string, unknown> = {
    status: input.status,
    last_error: input.lastError ?? null,
    updated_at: new Date().toISOString(),
  }
  if (input.lastSuccessfulSyncAt !== undefined) patch.last_successful_sync_at = input.lastSuccessfulSyncAt
  if (input.lastFailedSyncAt !== undefined) patch.last_failed_sync_at = input.lastFailedSyncAt

  const result = await supabase
    .from("data_sources")
    .update(patch)
    .eq("id", input.dataSourceId)
  assertNoError(result.error)
}

export async function createPersistedSyncRun(
  context: WorkspaceContext,
  dataSourceId: string,
  syncType: RuntimeSyncRun["syncType"],
) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .from("sync_runs")
    .insert({
      workspace_id: context.workspaceId,
      project_id: context.projectId,
      data_source_id: dataSourceId,
      status: "running",
      sync_type: syncType,
    })
    .select("*")
    .single()
  assertNoError(result.error)
  return mapSyncRunRow(result.data)
}

export async function finishPersistedSyncRun(runId: string, patch: Partial<RuntimeSyncRun>) {
  const supabase = createSupabaseAdminClient()
  const updatePayload: Record<string, unknown> = {
    finished_at: new Date().toISOString(),
  }
  if (patch.status !== undefined) updatePayload.status = patch.status
  if (patch.cursorBefore !== undefined) updatePayload.cursor_before = patch.cursorBefore
  if (patch.cursorAfter !== undefined) updatePayload.cursor_after = patch.cursorAfter
  if (patch.recordsRead !== undefined) updatePayload.records_read = patch.recordsRead
  if (patch.recordsInserted !== undefined) updatePayload.records_inserted = patch.recordsInserted
  if (patch.recordsDeduplicated !== undefined) updatePayload.records_deduplicated = patch.recordsDeduplicated
  if (patch.errorCode !== undefined) updatePayload.error_code = patch.errorCode
  if (patch.errorMessage !== undefined) updatePayload.error_message = patch.errorMessage

  const result = await supabase
    .from("sync_runs")
    .update(updatePayload)
    .eq("id", runId)
    .select("*")
    .single()
  assertNoError(result.error)
  return mapSyncRunRow(result.data)
}

function mapSyncRunRow(row: Record<string, unknown>): RuntimeSyncRun {
  return {
    id: String(row.id),
    dataSourceId: String(row.data_source_id),
    status: row.status as RuntimeSyncRun["status"],
    syncType: row.sync_type as RuntimeSyncRun["syncType"],
    startedAt: String(row.started_at ?? row.created_at),
    finishedAt: typeof row.finished_at === "string" ? row.finished_at : null,
    cursorBefore: typeof row.cursor_before === "string" ? row.cursor_before : null,
    cursorAfter: typeof row.cursor_after === "string" ? row.cursor_after : null,
    recordsRead: Number(row.records_read ?? 0),
    recordsInserted: Number(row.records_inserted ?? 0),
    recordsDeduplicated: Number(row.records_deduplicated ?? 0),
    errorCode: typeof row.error_code === "string" ? row.error_code : null,
    errorMessage: typeof row.error_message === "string" ? row.error_message : null,
  }
}

export async function upsertPersistedRawEvents(input: {
  context: WorkspaceContext
  dataSourceId: string
  syncRunId: string
  events: SourceEvent[]
}) {
  const supabase = createSupabaseAdminClient()
  const normalized = input.events.map((event) => normalizeSourceEvent(input.dataSourceId, event))
  const hashes = normalized.map((event) => event.hash)
  const existing = hashes.length
    ? await supabase
        .from("raw_events")
        .select("hash")
        .eq("workspace_id", input.context.workspaceId)
        .eq("project_id", input.context.projectId)
        .eq("data_source_id", input.dataSourceId)
        .in("hash", hashes)
    : { data: [], error: null }
  assertNoError(existing.error)

  const existingHashes = new Set((existing.data ?? []).map((row: { hash: string }) => row.hash))
  const inserted = normalized.filter((event) => !existingHashes.has(event.hash))

  if (inserted.length > 0) {
    const insertResult = await supabase.from("raw_events").insert(
      inserted.map((event) => ({
        workspace_id: input.context.workspaceId,
        project_id: input.context.projectId,
        data_source_id: input.dataSourceId,
        sync_run_id: input.syncRunId,
        external_id: event.externalId,
        event_name: event.eventName,
        canonical_event_name: event.canonicalEventName,
        actor_id: event.actorId,
        actor_type: event.actorType,
        entity_id: event.entityId,
        entity_type: event.entityType,
        occurred_at: event.occurredAt,
        received_at: event.receivedAt,
        properties: event.properties,
        hash: event.hash,
      })),
    )
    assertNoError(insertResult.error)
  }

  return {
    inserted,
    insertedCount: inserted.length,
    deduplicatedCount: normalized.length - inserted.length,
  }
}

export async function replacePersistedMetricSnapshots(input: {
  context: WorkspaceContext
  dataSourceId: string
  syncRunId: string
  metrics: MetricSnapshot[]
}) {
  const supabase = createSupabaseAdminClient()
  const deleteCurrent = await supabase
    .from("project_metrics")
    .delete()
    .eq("workspace_id", input.context.workspaceId)
    .eq("project_id", input.context.projectId)
    .eq("data_source_id", input.dataSourceId)
  assertNoError(deleteCurrent.error)

  if (input.metrics.length === 0) return

  const currentResult = await supabase.from("project_metrics").insert(
    input.metrics.map((metric) => ({
      workspace_id: input.context.workspaceId,
      project_id: input.context.projectId,
      key: metric.key,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      period_start: metric.periodStart,
      period_end: metric.periodEnd,
      source: metric.source,
      data_source_id: input.dataSourceId,
      formula: metric.formula,
      freshness_status: metric.freshnessStatus,
      confidence_level: metric.confidenceLevel,
      target_value: metric.targetValue,
    })),
  )
  assertNoError(currentResult.error)

  const snapshotsResult = await supabase.from("metric_snapshots").insert(
    input.metrics.map((metric) => ({
      workspace_id: input.context.workspaceId,
      project_id: input.context.projectId,
      metric_key: metric.key,
      metric_name: metric.name,
      value: metric.value,
      unit: metric.unit,
      period_start: metric.periodStart,
      period_end: metric.periodEnd,
      data_source_id: input.dataSourceId,
      sync_run_id: input.syncRunId,
      formula: metric.formula,
    })),
  )
  assertNoError(snapshotsResult.error)
}

async function replacePersistedEvidenceItems(input: {
  context: WorkspaceContext
  dataSourceId: string
  syncRunId: string
  evidence: EvidenceItem[]
  metrics: MetricSnapshot[]
  userId?: string
}) {
  const supabase = createSupabaseAdminClient()
  const evidenceTypes = input.evidence.map((item) => item.id)
  if (evidenceTypes.length === 0) return

  const deleteExisting = await supabase
    .from("evidence_items")
    .delete()
    .eq("workspace_id", input.context.workspaceId)
    .eq("project_id", input.context.projectId)
    .in("type", evidenceTypes)
  assertNoError(deleteExisting.error)

  const firstMetric = input.metrics[0]
  const insertResult = await supabase.from("evidence_items").insert(
    input.evidence.map((item) => ({
      workspace_id: input.context.workspaceId,
      project_id: input.context.projectId,
      type: item.id,
      code: item.code,
      classification: item.classification,
      title: item.title,
      content: item.content,
      source: item.source,
      source_kind: item.sourceKind,
      data_source_id: isUuid(input.dataSourceId) ? input.dataSourceId : null,
      sync_run_id: isUuid(input.syncRunId) ? input.syncRunId : null,
      observed_at: item.observedAt,
      period_start: firstMetric?.periodStart ?? null,
      period_end: firstMetric?.periodEnd ?? null,
      strength: item.strength,
      freshness_status: item.freshness,
      formula: item.formula ?? null,
      tags: item.tags,
      created_by: input.userId ?? null,
    })),
  )
  assertNoError(insertResult.error)
}

function mapRawEventRow(row: Record<string, unknown>): NormalizedEvent {
  return {
    externalId: String(row.external_id ?? row.id),
    eventName: String(row.event_name),
    canonicalEventName: row.canonical_event_name ? (String(row.canonical_event_name) as NormalizedEvent["canonicalEventName"]) : null,
    occurredAt: String(row.occurred_at),
    actorId: String(row.actor_id ?? "unknown_actor"),
    actorType: row.actor_type as NormalizedEvent["actorType"],
    entityId: String(row.entity_id ?? "unknown_entity"),
    entityType: String(row.entity_type ?? "entity"),
    properties: typeof row.properties === "object" && row.properties != null ? (row.properties as Record<string, unknown>) : {},
    dataSourceId: String(row.data_source_id),
    hash: String(row.hash),
    receivedAt: String(row.received_at ?? row.created_at),
  }
}

function mapProjectMetricRow(row: Record<string, unknown>): MetricSnapshot {
  return {
    key: String(row.key),
    name: String(row.name),
    value: Number(row.value ?? 0),
    unit: String(row.unit),
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    source: String(row.source),
    dataSourceId: String(row.data_source_id),
    formula: String(row.formula),
    freshnessStatus: row.freshness_status as MetricSnapshot["freshnessStatus"],
    confidenceLevel: row.confidence_level as MetricSnapshot["confidenceLevel"],
    targetValue: row.target_value == null ? null : Number(row.target_value),
  }
}

function mapEvidenceRow(row: Record<string, unknown>): Evidence {
  return {
    id: String(row.id),
    code: String(row.code ?? row.type ?? row.id),
    title: String(row.title ?? "Preuve"),
    content: String(row.content ?? ""),
    classification: row.classification as Evidence["classification"],
    sourceKind: row.source_kind as Evidence["sourceKind"],
    source: String(row.source ?? "Source synchronisée"),
    strength: row.strength as Evidence["strength"],
    freshness: row.freshness_status as Evidence["freshness"],
    observedAt: nullableString(row.observed_at) ?? String(row.created_at ?? ""),
    tags: asStringArray(row.tags),
    formula: nullableString(row.formula) ?? undefined,
  }
}

export async function listPersistedEvidenceForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("evidence_items")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: false })
  assertNoError(result.error)

  return (result.data ?? []).map(mapEvidenceRow)
}

function mapEventMappingRow(row: Record<string, unknown>): EventMappingRow {
  return {
    id: String(row.id),
    sourceEvent: String(row.source_event_name ?? ""),
    canonicalEvent: row.canonical_event_name as EventMappingRow["canonicalEvent"],
    actorType: (nullableString(row.actor_type) ?? "system") as EventMappingRow["actorType"],
    entityType: nullableString(row.entity_type) ?? "entity",
    funnelStage: nullableString(row.funnel_stage) ?? "Non classé",
    active: Boolean(row.is_active),
    version: Number(row.version ?? 1),
  }
}

export async function listPersistedEventMappingsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("event_mappings")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: true })
  assertNoError(result.error)

  return (result.data ?? []).map(mapEventMappingRow)
}

export async function loadPersistedRuntimeState(user: Pick<User, "id" | "email" | "user_metadata">): Promise<RuntimeState> {
  const context = await ensureWorkspaceForUser(user)
  return loadPersistedRuntimeStateForContext(context)
}

export async function loadPersistedRuntimeStateForContext(context: WorkspaceContext): Promise<RuntimeState> {
  const supabase = createSupabaseAdminClient()
  const [eventsResult, syncRunsResult, metricsResult] = await Promise.all([
    supabase
      .from("raw_events")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .eq("project_id", context.projectId)
      .order("occurred_at", { ascending: true })
      .limit(10_000),
    supabase
      .from("sync_runs")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .eq("project_id", context.projectId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("project_metrics")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .eq("project_id", context.projectId)
      .order("created_at", { ascending: false }),
  ])
  assertNoError(eventsResult.error)
  assertNoError(syncRunsResult.error)
  assertNoError(metricsResult.error)

  return {
    rawEvents: (eventsResult.data ?? []).map(mapRawEventRow),
    syncRuns: (syncRunsResult.data ?? []).map(mapSyncRunRow),
    metricSnapshots: (metricsResult.data ?? []).map(mapProjectMetricRow),
  }
}

export async function computeAndPersistMetrics(input: {
  context: WorkspaceContext
  dataSourceId: string
  syncRunId: string
  sourceLabel: string
}) {
  const state = await loadPersistedRuntimeStateForContext(input.context)
  const metrics = computeMetricSnapshots(state.rawEvents, input.dataSourceId, input.sourceLabel)
  await replacePersistedMetricSnapshots({
    context: input.context,
    dataSourceId: input.dataSourceId,
    syncRunId: input.syncRunId,
    metrics,
  })
  await replacePersistedEvidenceItems({
    context: input.context,
    dataSourceId: input.dataSourceId,
    syncRunId: input.syncRunId,
    evidence: generateEvidenceFromMetrics(state.rawEvents, metrics),
    metrics,
    userId: input.context.userId,
  })
  return metrics
}

function mapGatewayProfileRow(row: Record<string, unknown>): GatewayProfile {
  return {
    id: String(row.id),
    provider: row.provider as GatewayProfile["provider"],
    name: String(row.name),
    transport: row.transport as GatewayProfile["transport"],
    mode: "read_only",
    endpoint: String(row.endpoint_url),
    status: row.status as GatewayProfile["status"],
    capabilities: asStringArray(row.capabilities) as GatewayCapability[],
    scopes: asStringArray(row.scopes),
    lastHealthCheckAt: nullableString(row.last_health_check_at),
  }
}

export async function listPersistedGatewayProfilesForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("gateway_profiles")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: true })
  assertNoError(result.error)
  return (result.data ?? []).map(mapGatewayProfileRow)
}

export async function loadPersistedGatewayProfileForUser(
  user: Pick<User, "id" | "email" | "user_metadata">,
  gatewayProfileId: string,
) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("gateway_profiles")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .eq("id", gatewayProfileId)
    .maybeSingle()
  assertNoError(result.error)
  if (!result.data) return null
  return {
    context,
    profile: mapGatewayProfileRow(result.data),
  }
}

export async function saveGatewayProfile(input: SaveGatewayInput) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const now = new Date().toISOString()
  const endpoint = input.endpoint.trim()
  const result = await supabase
    .from("gateway_profiles")
    .insert({
      workspace_id: context.workspaceId,
      project_id: context.projectId,
      provider: input.provider,
      name: input.name.trim() || "Gateway de production",
      transport: input.transport,
      mode: "read_only",
      endpoint_url: endpoint,
      capabilities: input.capabilities ?? [],
      scopes: input.scopes ?? ["project:read", "events:read", "metrics:read"],
      status: input.capabilities?.length ? "connected" : "not_connected",
      last_health_check_at: input.capabilities?.length ? now : null,
      created_by: input.user.id,
      updated_at: now,
    })
    .select("*")
    .single()
  assertNoError(result.error)
  const profile = mapGatewayProfileRow(requireData(result.data, "Gateway impossible à créer."))

  const encrypted = encryptSecret({
    provider: input.provider,
    endpoint,
    token: input.token?.trim(),
    savedAt: now,
  } satisfies GatewaySecretPayload)

  const secretWrite = await supabase.from("gateway_secrets").insert({
    workspace_id: context.workspaceId,
    project_id: context.projectId,
    gateway_profile_id: profile.id,
    encrypted_payload: encrypted.encryptedPayload,
    encryption_key_version: encrypted.keyVersion,
    created_by: input.user.id,
  })
  assertNoError(secretWrite.error)

  return {
    context,
    profile,
  }
}

export async function loadGatewaySecret(gatewayProfileId: string) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .from("gateway_secrets")
    .select("encrypted_payload")
    .eq("gateway_profile_id", gatewayProfileId)
    .limit(1)
    .maybeSingle()
  assertNoError(result.error)
  if (!result.data?.encrypted_payload) return null
  return decryptSecret<GatewaySecretPayload>(String(result.data.encrypted_payload))
}

export async function updateGatewayProfileStatus(input: {
  gatewayProfileId: string
  status: GatewayProfile["status"]
  capabilities?: GatewayCapability[]
  lastHealthCheckAt?: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }
  if (input.capabilities !== undefined) patch.capabilities = input.capabilities
  if (input.lastHealthCheckAt !== undefined) patch.last_health_check_at = input.lastHealthCheckAt

  const result = await supabase.from("gateway_profiles").update(patch).eq("id", input.gatewayProfileId)
  assertNoError(result.error)
}

export async function recordGatewayCapabilityChecks(input: {
  context: WorkspaceContext
  gatewayProfileId: string
  capabilities: GatewayCapability[]
  latencyMs: number
  message: string
}) {
  if (input.capabilities.length === 0) return
  const supabase = createSupabaseAdminClient()
  const result = await supabase.from("gateway_capability_checks").insert(
    input.capabilities.map((capability) => ({
      workspace_id: input.context.workspaceId,
      project_id: input.context.projectId,
      gateway_profile_id: input.gatewayProfileId,
      capability,
      status: "available",
      latency_ms: input.latencyMs,
      message: input.message,
    })),
  )
  assertNoError(result.error)
}

export async function recordGatewayToolRun(input: {
  context: WorkspaceContext
  gatewayProfileId: string
  capability: GatewayCapability
  operation: string
  recordsRead?: number
  status: "success" | "error"
  latencyMs?: number
  errorCode?: string | null
  errorMessage?: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase.from("gateway_tool_runs").insert({
    workspace_id: input.context.workspaceId,
    project_id: input.context.projectId,
    gateway_profile_id: input.gatewayProfileId,
    capability: input.capability,
    operation: input.operation,
    records_read: input.recordsRead ?? 0,
    status: input.status,
    latency_ms: input.latencyMs ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
  })
  assertNoError(result.error)
}

export async function ensureGatewayDataSource(input: {
  context: WorkspaceContext
  userId: string
  profile: GatewayProfile
}) {
  const supabase = createSupabaseAdminClient()
  const existing = await supabase
    .from("data_sources")
    .select("id")
    .eq("workspace_id", input.context.workspaceId)
    .eq("project_id", input.context.projectId)
    .eq("provider", input.profile.provider)
    .contains("config", { gatewayProfileId: input.profile.id })
    .limit(1)
    .maybeSingle()
  assertNoError(existing.error)
  if (existing.data?.id) return String(existing.data.id)

  const created = await supabase
    .from("data_sources")
    .insert({
      workspace_id: input.context.workspaceId,
      project_id: input.context.projectId,
      provider: input.profile.provider,
      name: input.profile.name,
      status: "connected",
      sync_mode: "manual",
      config: {
        gatewayProfileId: input.profile.id,
        endpoint: input.profile.endpoint,
      },
      created_by: input.userId,
    })
    .select("id")
    .single()
  assertNoError(created.error)
  return String(requireData(created.data, "Data source Gateway impossible à créer.").id)
}

export async function countUsageEventsToday(input: {
  context: WorkspaceContext
  userId: string
  eventType: string
}) {
  const supabase = createSupabaseAdminClient()
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  const result = await supabase
    .from("usage_events")
    .select("quantity")
    .eq("workspace_id", input.context.workspaceId)
    .eq("user_id", input.userId)
    .eq("event_type", input.eventType)
    .gte("created_at", start.toISOString())
  assertNoError(result.error)

  return (result.data ?? []).reduce((sum: number, row: { quantity?: number | string | null }) => {
    return sum + Number(row.quantity ?? 0)
  }, 0)
}

export async function reserveAIUsage(input: {
  context: WorkspaceContext
  userId: string
  eventType: string
  quantity?: number
  limit: number
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .rpc("reserve_ai_usage", {
      p_workspace_id: input.context.workspaceId,
      p_user_id: input.userId,
      p_event_type: input.eventType,
      p_quantity: input.quantity ?? 1,
      p_limit: input.limit,
    })
    .single()
  assertNoError(result.error)

  const data = requireData(result.data as Record<string, unknown> | null, "Réservation IA impossible.")
  return {
    allowed: Boolean(data.allowed),
    used: Number(data.used ?? 0),
    limit: Number(data.daily_limit ?? input.limit),
  }
}

export async function releaseAIUsage(input: {
  context: WorkspaceContext
  userId: string
  eventType: string
  quantity?: number
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase.rpc("release_ai_usage", {
    p_workspace_id: input.context.workspaceId,
    p_user_id: input.userId,
    p_event_type: input.eventType,
    p_quantity: input.quantity ?? 1,
  })
  assertNoError(result.error)
}

export async function recordUsageEvent(input: {
  context: WorkspaceContext
  userId: string
  eventType: string
  quantity?: number
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase.from("usage_events").insert({
    workspace_id: input.context.workspaceId,
    user_id: input.userId,
    event_type: input.eventType,
    quantity: input.quantity ?? 1,
  })
  assertNoError(result.error)
}

export async function recordAIRun(input: {
  context: WorkspaceContext
  feature: string
  provider: string
  model: string
  promptVersion: string
  inputHash?: string | null
  inputSize?: number | null
  latencyMs?: number | null
  success: boolean
  errorCode?: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const result = await supabase.from("ai_runs").insert({
    workspace_id: input.context.workspaceId,
    project_id: input.context.projectId,
    feature: input.feature,
    provider: input.provider,
    model: input.model,
    prompt_version: input.promptVersion,
    input_hash: input.inputHash ?? null,
    input_size: input.inputSize ?? null,
    input_tokens: null,
    output_tokens: null,
    latency_ms: input.latencyMs ?? null,
    success: input.success,
    error_code: input.errorCode ?? null,
  })
  assertNoError(result.error)
}

function dataSourceUuidList(metrics: MetricSnapshot[]) {
  return [...new Set(metrics.map((metric) => metric.dataSourceId).filter(isUuid))]
}

function evidenceUuidList(ids: string[]) {
  return ids.filter(isUuid)
}

export async function persistDiagnosticRun(input: {
  user: Pick<User, "id" | "email" | "user_metadata">
  diagnostic: DiagnosticOutput
  scores: {
    confidenceScore: number
    completenessScore: number
    dataQualityScore: number
  }
  evidence: EvidenceItem[]
  metrics: MetricSnapshot[]
}) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const evidenceIds = [
    ...input.diagnostic.bottleneck.evidenceIds,
    ...input.diagnostic.facts.flatMap((item) => item.evidenceIds),
    ...input.diagnostic.signals.flatMap((item) => item.evidenceIds),
    ...input.diagnostic.assumptions.flatMap((item) => item.evidenceIds),
  ]
  const evidenceRows = evidenceIds.length
    ? await supabase
        .from("evidence_items")
        .select("id, type")
        .eq("workspace_id", context.workspaceId)
        .eq("project_id", context.projectId)
        .in("type", [...new Set(evidenceIds)])
    : { data: [], error: null }
  assertNoError(evidenceRows.error)
  const persistedEvidenceIds = (evidenceRows.data ?? []).map((row: { id: string }) => row.id)

  const result = await supabase
    .from("diagnostics")
    .insert({
      workspace_id: context.workspaceId,
      project_id: context.projectId,
      status: input.diagnostic.status,
      proposed_bottleneck: input.diagnostic.bottleneck.type,
      confirmed_bottleneck: null,
      confidence_score: input.scores.confidenceScore,
      completeness_score: input.scores.completenessScore,
      data_quality_score: input.scores.dataQualityScore,
      evidence_ids: persistedEvidenceIds.length > 0 ? persistedEvidenceIds : evidenceUuidList(evidenceIds),
      data_source_ids: dataSourceUuidList(input.metrics),
      structured_output: {
        ...input.diagnostic,
        evidenceIds,
        evidenceCodes: input.evidence.map((item) => ({ id: item.id, code: item.code })),
      },
      model: aiConfig.provider === "openai" ? aiConfig.model : "mock-ai-provider",
      prompt_version: "diagnostic@runtime-v1",
      created_by: input.user.id,
    })
    .select("id")
    .single()
  assertNoError(result.error)
  return {
    context,
    diagnosticId: String(requireData(result.data, "Diagnostic impossible à créer.").id),
  }
}

function mapDiagnosticExportRow(row: Record<string, unknown>): PersistedDiagnosticExport {
  return {
    id: String(row.id),
    status: String(row.status),
    proposedBottleneck: String(row.proposed_bottleneck),
    confirmedBottleneck: nullableString(row.confirmed_bottleneck),
    confidenceScore: Number(row.confidence_score ?? 0),
    completenessScore: Number(row.completeness_score ?? 0),
    dataQualityScore: Number(row.data_quality_score ?? 0),
    evidenceIds: asStringArray(row.evidence_ids),
    dataSourceIds: asStringArray(row.data_source_ids),
    structuredOutput: asRecord(row.structured_output),
    model: String(row.model ?? ""),
    promptVersion: String(row.prompt_version ?? ""),
    createdAt: String(row.created_at ?? ""),
  }
}

export async function listPersistedDiagnosticsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("diagnostics")
    .select(
      "id, status, proposed_bottleneck, confirmed_bottleneck, confidence_score, completeness_score, data_quality_score, evidence_ids, data_source_ids, structured_output, model, prompt_version, created_at",
    )
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: false })
    .limit(100)
  assertNoError(result.error)

  return (result.data ?? []).map(mapDiagnosticExportRow)
}

const assetTypes = new Set<AssetType>(["landing_page", "cold_email", "interview_script"])

function asAssetTypes(value: unknown): AssetType[] {
  return asStringArray(value).filter((item): item is AssetType => assetTypes.has(item as AssetType))
}

function daysElapsed(startedAt: unknown, endedAt: unknown) {
  const start = nullableString(startedAt)
  if (!start) return 0
  const end = nullableString(endedAt) ?? new Date().toISOString()
  const delta = Date.parse(end) - Date.parse(start)
  if (!Number.isFinite(delta) || delta < 0) return 0
  return Math.floor(delta / 86_400_000)
}

function mapExperimentMeasurements(rows: Record<string, unknown>[], baseline: number | null): ExperimentMetricPoint[] {
  return rows.map((row) => ({
    day: String(row.recorded_at ?? row.created_at ?? "").slice(0, 10),
    value: Number(row.value ?? 0),
    baseline: baseline ?? Number(row.value ?? 0),
  }))
}

function mapExperimentRow(row: Record<string, unknown>, measurements: Record<string, unknown>[] = []): Experiment {
  const primaryMetric = asRecord(row.primary_metric)
  const guardrailMetrics = Array.isArray(row.guardrail_metrics) ? row.guardrail_metrics.map(asRecord) : []
  const steps = Array.isArray(row.steps) ? row.steps.map(asRecord) : []
  const decisionRules = asRecord(row.decision_rules)
  const assets = Array.isArray(row.experiment_assets) ? row.experiment_assets.map(asRecord) : []
  const baseline = nullableNumber(primaryMetric.baseline)

  return {
    id: String(row.id),
    title: String(row.title),
    status: row.status as Experiment["status"],
    hypothesis: String(row.hypothesis),
    targetSegment: String(row.target_segment ?? ""),
    problem: String(primaryMetric.problem ?? row.hypothesis),
    channel: String(row.channel ?? ""),
    offer: String(row.offer ?? ""),
    valueProposition: String(row.value_proposition ?? ""),
    rationale: String(primaryMetric.rationale ?? row.value_proposition ?? ""),
    primaryMetric: {
      key: String(primaryMetric.key ?? ""),
      name: String(primaryMetric.name ?? ""),
      unit: String(primaryMetric.unit ?? ""),
      baseline,
      target: nullableNumber(primaryMetric.target),
      targetIsHypothesis: Boolean(primaryMetric.targetIsHypothesis),
      direction: primaryMetric.direction === "decrease" ? "decrease" : "increase",
      current: nullableNumber(primaryMetric.current),
    },
    guardrailMetrics: guardrailMetrics.map((metric) => ({
      key: String(metric.key ?? ""),
      name: String(metric.name ?? ""),
      unit: String(metric.unit ?? ""),
      value: nullableNumber(metric.value),
    })),
    durationDays: Number(row.duration_days ?? 0),
    daysElapsed: daysElapsed(row.started_at, row.ended_at),
    estimatedBudget: nullableNumber(row.estimated_budget),
    steps: steps.map((step) => ({
      order: Number(step.order ?? 0),
      title: String(step.title ?? ""),
      description: String(step.description ?? ""),
    })),
    decisionRules: {
      continue: String(decisionRules.continue ?? ""),
      iterate: String(decisionRules.iterate ?? ""),
      stop: String(decisionRules.stop ?? ""),
    },
    requiredAssets: asAssetTypes(primaryMetric.requiredAssets),
    assets: assets
      .map((asset) => ({
        type: String(asset.asset_type) as AssetType,
        generated: Boolean(asset.content),
      }))
      .filter((asset): asset is { type: AssetType; generated: boolean } => assetTypes.has(asset.type)),
    evidenceIds: asStringArray(primaryMetric.evidenceIds),
    risks: asStringArray(primaryMetric.risks),
    measurementSource: nullableString(primaryMetric.measurementSource),
    series: mapExperimentMeasurements(measurements, baseline),
    notes: [],
    abandonReason: row.status === "abandoned" ? nullableString(row.final_outcome) ?? undefined : undefined,
  }
}

async function loadMeasurementsForExperiments(context: WorkspaceContext, experimentIds: string[]) {
  if (experimentIds.length === 0) return new Map<string, Record<string, unknown>[]>()

  const supabase = createSupabaseAdminClient()
  const result = await supabase
    .from("experiment_measurements")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .in("experiment_id", experimentIds)
    .order("recorded_at", { ascending: true })
  assertNoError(result.error)

  const byExperiment = new Map<string, Record<string, unknown>[]>()
  for (const row of result.data ?? []) {
    const experimentId = String(row.experiment_id)
    byExperiment.set(experimentId, [...(byExperiment.get(experimentId) ?? []), row])
  }
  return byExperiment
}

export async function listPersistedExperimentsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("experiments")
    .select("*, experiment_assets(asset_type, content)")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: false })
  assertNoError(result.error)

  const rows = result.data ?? []
  const measurements = await loadMeasurementsForExperiments(context, rows.map((row) => String(row.id)))
  return rows.map((row) => mapExperimentRow(row, measurements.get(String(row.id)) ?? []))
}

export async function loadPersistedExperimentForUser(
  user: Pick<User, "id" | "email" | "user_metadata">,
  experimentId: string,
) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("experiments")
    .select("*, experiment_assets(asset_type, content)")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .eq("id", experimentId)
    .maybeSingle()
  assertNoError(result.error)
  if (!result.data) return null

  const measurements = await loadMeasurementsForExperiments(context, [experimentId])
  return mapExperimentRow(result.data, measurements.get(experimentId) ?? [])
}

export async function createPersistedExperimentFromPlan(input: {
  user: Pick<User, "id" | "email" | "user_metadata">
  diagnosticId?: string | null
  plan: ExperimentPlanOutput
}) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const primaryMetric = {
    ...input.plan.primaryMetric,
    current: null,
    problem: input.plan.problem,
    rationale: input.plan.rationale,
    requiredAssets: input.plan.requiredAssets,
    risks: input.plan.risks,
    evidenceIds: input.plan.evidenceIds,
    measurementSource: null,
  }

  const result = await supabase
    .from("experiments")
    .insert({
      workspace_id: context.workspaceId,
      project_id: context.projectId,
      diagnostic_id: input.diagnosticId ?? null,
      title: input.plan.title,
      status: "ready",
      hypothesis: input.plan.hypothesis,
      target_segment: input.plan.targetSegment,
      channel: input.plan.channel,
      offer: input.plan.offer,
      value_proposition: input.plan.valueProposition,
      primary_metric: primaryMetric,
      guardrail_metrics: input.plan.guardrailMetrics.map((metric) => ({ ...metric, value: null })),
      duration_days: input.plan.durationDays,
      estimated_budget: input.plan.estimatedBudget,
      steps: input.plan.steps,
      decision_rules: input.plan.decisionRules,
      evidence_ids: evidenceUuidList(input.plan.evidenceIds),
      created_by: input.user.id,
    })
    .select("*, experiment_assets(asset_type, content)")
    .single()
  assertNoError(result.error)
  return mapExperimentRow(requireData(result.data, "Expérience impossible à créer."))
}

export async function updatePersistedExperimentForUser(input: {
  user: Pick<User, "id" | "email" | "user_metadata">
  experimentId: string
  status?: Experiment["status"]
  startedAt?: string | null
  endedAt?: string | null
  finalOutcome?: string | null
  primaryMetric?: Record<string, unknown>
}) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.status !== undefined) patch.status = input.status
  if (input.startedAt !== undefined) patch.started_at = input.startedAt
  if (input.endedAt !== undefined) patch.ended_at = input.endedAt
  if (input.finalOutcome !== undefined) patch.final_outcome = input.finalOutcome
  if (input.primaryMetric !== undefined) {
    const existing = await supabase
      .from("experiments")
      .select("primary_metric")
      .eq("workspace_id", context.workspaceId)
      .eq("project_id", context.projectId)
      .eq("id", input.experimentId)
      .maybeSingle()
    assertNoError(existing.error)
    patch.primary_metric = {
      ...asRecord(existing.data?.primary_metric),
      ...input.primaryMetric,
    }
  }

  const result = await supabase
    .from("experiments")
    .update(patch)
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .eq("id", input.experimentId)
    .select("*, experiment_assets(asset_type, content)")
    .maybeSingle()
  assertNoError(result.error)
  return result.data ? mapExperimentRow(result.data) : null
}

function mapLearningRow(row: Record<string, unknown>): Learning {
  const output = asRecord(row.structured_output)
  const experiment = asRecord(row.experiments)

  return {
    id: String(row.id),
    experimentId: String(row.experiment_id),
    experimentTitle: String(experiment.title ?? "Expérience"),
    outcome: row.outcome as Learning["outcome"],
    observedResult: String(output.observedResult ?? ""),
    delta: String(output.delta ?? "—"),
    supportedFindings: asStringArray(output.supportedFindings),
    rejectedFindings: asStringArray(output.rejectedFindings),
    unresolvedQuestions: asStringArray(output.unresolvedQuestions),
    nextRecommendation: String(output.nextRecommendation ?? ""),
    causalityNote: nullableString(output.causalityNote),
    date: String(row.created_at ?? "").slice(0, 10),
  }
}

export async function createPersistedLearning(input: {
  user: Pick<User, "id" | "email" | "user_metadata">
  experimentId: string
  outcome: Learning["outcome"]
  learning: LearningOutput
  metrics: MetricSnapshot[]
}) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(input.user)
  const result = await supabase
    .from("learnings")
    .insert({
      workspace_id: context.workspaceId,
      project_id: context.projectId,
      experiment_id: input.experimentId,
      outcome: input.outcome,
      structured_output: input.learning,
      data_source_ids: dataSourceUuidList(input.metrics),
      evidence_ids: evidenceUuidList(input.learning.evidenceIds),
      created_by: input.user.id,
    })
    .select("*, experiments(title)")
    .single()
  assertNoError(result.error)
  return mapLearningRow(requireData(result.data, "Apprentissage impossible à créer."))
}

export async function listPersistedLearningsForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const supabase = createSupabaseAdminClient()
  const context = await ensureWorkspaceForUser(user)
  const result = await supabase
    .from("learnings")
    .select("*, experiments(title)")
    .eq("workspace_id", context.workspaceId)
    .eq("project_id", context.projectId)
    .order("created_at", { ascending: false })
  assertNoError(result.error)
  return (result.data ?? []).map(mapLearningRow)
}
