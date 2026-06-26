create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key,
  full_name text,
  avatar_url text,
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id),
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  website_url text,
  description text,
  business_model text,
  stage text,
  product_type text,
  target_segment text,
  primary_user text,
  problem_statement text,
  buying_trigger text,
  current_alternative text,
  value_proposition text,
  pricing_description text,
  sales_motion text,
  sales_cycle text,
  primary_goal text,
  experiment_budget numeric,
  available_channels text[] not null default '{}',
  constraints text,
  activation_definition text,
  data_connection_required boolean not null default true,
  onboarding_completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('postgres','supabase_postgres','firebase_firestore','rest_api','webhook_events','stripe_readonly','mock_gateway','http_gateway','mcp_gateway','codex_mcp_gateway','hermes_style_gateway')),
  name text not null,
  status text not null check (status in ('connected','syncing','error','not_connected')),
  sync_mode text not null check (sync_mode in ('scheduled','incremental','manual')),
  config jsonb not null default '{}'::jsonb,
  last_successful_sync_at timestamptz,
  last_failed_sync_at timestamptz,
  last_error text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.connector_secrets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  encrypted_payload text not null,
  encryption_key_version integer not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  status text not null check (status in ('running','success','error')),
  sync_type text not null check (sync_type in ('initial','incremental','manual','gateway')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cursor_before text,
  cursor_after text,
  records_read integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_deduplicated integer not null default 0,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.connector_health_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  status text not null,
  latency_ms integer,
  checked_at timestamptz not null default now(),
  message text,
  created_at timestamptz not null default now()
);

create table public.gateway_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null check (provider in ('mock_gateway','http_gateway','mcp_gateway','codex_mcp_gateway','hermes_style_gateway')),
  name text not null,
  transport text not null check (transport in ('http','mcp')),
  mode text not null default 'read_only' check (mode = 'read_only'),
  endpoint_url text not null,
  capabilities text[] not null default '{}',
  scopes text[] not null default '{}',
  status text not null check (status in ('connected','syncing','error','not_connected')),
  last_health_check_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gateway_secrets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  gateway_profile_id uuid not null references public.gateway_profiles(id) on delete cascade,
  encrypted_payload text not null,
  encryption_key_version integer not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gateway_capability_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  gateway_profile_id uuid not null references public.gateway_profiles(id) on delete cascade,
  capability text not null,
  status text not null,
  latency_ms integer,
  checked_at timestamptz not null default now(),
  message text,
  created_at timestamptz not null default now()
);

create table public.gateway_tool_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  gateway_profile_id uuid references public.gateway_profiles(id) on delete set null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  capability text not null,
  operation text not null,
  input_hash text,
  output_hash text,
  records_read integer not null default 0,
  status text not null,
  latency_ms integer,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.source_schemas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  schema_type text not null,
  object_name text not null,
  fields jsonb not null default '[]'::jsonb,
  sample_payload jsonb,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.event_mappings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid references public.data_sources(id) on delete set null,
  source_event_name text not null,
  canonical_event_name text not null,
  actor_id_path text,
  actor_type text,
  entity_id_path text,
  entity_type text,
  occurred_at_path text,
  properties_mapping jsonb not null default '{}'::jsonb,
  funnel_stage text,
  is_active boolean not null default true,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raw_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  external_id text,
  event_name text not null,
  canonical_event_name text,
  actor_id text,
  actor_type text,
  entity_id text,
  entity_type text,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  properties jsonb not null default '{}'::jsonb,
  hash text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, project_id, data_source_id, hash)
);

create table public.project_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  name text not null,
  value numeric not null,
  unit text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  source text not null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  formula text not null,
  freshness_status text not null,
  confidence_level text not null,
  target_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  experiment_id uuid,
  metric_key text not null,
  metric_name text not null,
  value numeric not null,
  unit text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  formula text not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.funnel_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid references public.data_sources(id) on delete set null,
  funnel_name text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  steps jsonb not null,
  dropoffs jsonb not null default '[]'::jsonb,
  primary_dropoff_step text,
  created_at timestamptz not null default now()
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  classification text not null check (classification in ('fact','signal','assumption','unknown')),
  title text not null,
  content text not null,
  source text not null,
  source_kind text not null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  raw_event_id uuid references public.raw_events(id) on delete set null,
  metric_snapshot_id uuid references public.metric_snapshots(id) on delete set null,
  observed_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  strength text not null check (strength in ('weak','medium','strong')),
  freshness_status text not null check (freshness_status in ('fresh','recent','stale')),
  formula text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null check (status in ('sufficient','insufficient')),
  proposed_bottleneck text not null,
  confirmed_bottleneck text,
  confidence_score integer not null,
  completeness_score integer not null,
  data_quality_score integer not null,
  evidence_ids uuid[] not null default '{}',
  data_source_ids uuid[] not null default '{}',
  structured_output jsonb not null,
  model text not null,
  prompt_version text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  diagnostic_id uuid references public.diagnostics(id) on delete set null,
  title text not null,
  status text not null check (status in ('draft','ready','running','completed','abandoned')),
  hypothesis text not null,
  target_segment text,
  channel text,
  offer text,
  value_proposition text,
  primary_metric jsonb not null,
  guardrail_metrics jsonb not null default '[]'::jsonb,
  measurement_source_id uuid references public.data_sources(id) on delete set null,
  baseline_snapshot_id uuid references public.metric_snapshots(id) on delete set null,
  duration_days integer not null,
  estimated_budget numeric,
  steps jsonb not null default '[]'::jsonb,
  decision_rules jsonb not null default '{}'::jsonb,
  evidence_ids uuid[] not null default '{}',
  started_at timestamptz,
  ended_at timestamptz,
  final_outcome text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_running_experiment_per_project
  on public.experiments(project_id)
  where status = 'running';

create table public.experiment_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  asset_type text not null,
  title text not null,
  content text not null,
  version integer not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiment_measurements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  metric_snapshot_id uuid not null references public.metric_snapshots(id) on delete restrict,
  measurement_type text not null,
  value numeric not null,
  unit text not null,
  source text not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.experiment_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.learnings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  outcome text not null check (outcome in ('validated','invalidated','inconclusive')),
  structured_output jsonb not null,
  data_source_ids uuid[] not null default '{}',
  evidence_ids uuid[] not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  feature text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  input_hash text,
  input_size integer,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index on public.projects(workspace_id);
create index on public.data_sources(workspace_id, project_id);
create index on public.sync_runs(workspace_id, project_id, data_source_id, created_at desc);
create index on public.raw_events(workspace_id, project_id, data_source_id, canonical_event_name, occurred_at);
create index on public.metric_snapshots(workspace_id, project_id, metric_key, recorded_at desc);
create index on public.funnel_snapshots(workspace_id, project_id, created_at desc);
create index on public.evidence_items(workspace_id, project_id, classification, created_at desc);
create index on public.gateway_tool_runs(workspace_id, project_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.data_sources enable row level security;
alter table public.connector_secrets enable row level security;
alter table public.sync_runs enable row level security;
alter table public.connector_health_checks enable row level security;
alter table public.gateway_profiles enable row level security;
alter table public.gateway_secrets enable row level security;
alter table public.gateway_capability_checks enable row level security;
alter table public.gateway_tool_runs enable row level security;
alter table public.source_schemas enable row level security;
alter table public.event_mappings enable row level security;
alter table public.raw_events enable row level security;
alter table public.project_metrics enable row level security;
alter table public.metric_snapshots enable row level security;
alter table public.funnel_snapshots enable row level security;
alter table public.evidence_items enable row level security;
alter table public.diagnostics enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_assets enable row level security;
alter table public.experiment_measurements enable row level security;
alter table public.experiment_notes enable row level security;
alter table public.learnings enable row level security;
alter table public.ai_runs enable row level security;
alter table public.usage_events enable row level security;

create policy "profiles own row" on public.profiles
  for select using (id = auth.uid());

create policy "workspace members read workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));

create policy "workspace members read membership" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped projects" on public.projects
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped data_sources" on public.data_sources
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped sync_runs" on public.sync_runs
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped health" on public.connector_health_checks
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped gateway_profiles" on public.gateway_profiles
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped gateway audits" on public.gateway_tool_runs
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped schemas" on public.source_schemas
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped mappings" on public.event_mappings
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped raw_events" on public.raw_events
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped project_metrics" on public.project_metrics
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped metric_snapshots" on public.metric_snapshots
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped funnel_snapshots" on public.funnel_snapshots
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped evidence" on public.evidence_items
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped diagnostics" on public.diagnostics
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped experiments" on public.experiments
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped assets" on public.experiment_assets
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped measurements" on public.experiment_measurements
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped notes" on public.experiment_notes
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped learnings" on public.learnings
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "workspace scoped ai_runs" on public.ai_runs
  for select using (public.is_workspace_member(workspace_id));

create policy "workspace scoped usage" on public.usage_events
  for select using (public.is_workspace_member(workspace_id));

-- No browser policies are created for connector_secrets and gateway_secrets.
-- They are service-role only by default under RLS.
