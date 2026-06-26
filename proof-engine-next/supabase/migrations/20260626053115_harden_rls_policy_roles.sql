revoke all on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "workspace members read workspaces" on public.workspaces;
create policy "workspace members read workspaces" on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "workspace members read membership" on public.workspace_members;
create policy "workspace members read membership" on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped projects" on public.projects;
create policy "workspace scoped projects" on public.projects
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped data_sources" on public.data_sources;
create policy "workspace scoped data_sources" on public.data_sources
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped sync_runs" on public.sync_runs;
create policy "workspace scoped sync_runs" on public.sync_runs
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped health" on public.connector_health_checks;
create policy "workspace scoped health" on public.connector_health_checks
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped gateway_profiles" on public.gateway_profiles;
create policy "workspace scoped gateway_profiles" on public.gateway_profiles
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped gateway_capability_checks" on public.gateway_capability_checks;
create policy "workspace scoped gateway_capability_checks" on public.gateway_capability_checks
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped gateway audits" on public.gateway_tool_runs;
create policy "workspace scoped gateway audits" on public.gateway_tool_runs
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped schemas" on public.source_schemas;
create policy "workspace scoped schemas" on public.source_schemas
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped mappings" on public.event_mappings;
create policy "workspace scoped mappings" on public.event_mappings
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped raw_events" on public.raw_events;
create policy "workspace scoped raw_events" on public.raw_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped project_metrics" on public.project_metrics;
create policy "workspace scoped project_metrics" on public.project_metrics
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped metric_snapshots" on public.metric_snapshots;
create policy "workspace scoped metric_snapshots" on public.metric_snapshots
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped funnel_snapshots" on public.funnel_snapshots;
create policy "workspace scoped funnel_snapshots" on public.funnel_snapshots
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped evidence" on public.evidence_items;
create policy "workspace scoped evidence" on public.evidence_items
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped diagnostics" on public.diagnostics;
create policy "workspace scoped diagnostics" on public.diagnostics
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped experiments" on public.experiments;
create policy "workspace scoped experiments" on public.experiments
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped assets" on public.experiment_assets;
create policy "workspace scoped assets" on public.experiment_assets
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped measurements" on public.experiment_measurements;
create policy "workspace scoped measurements" on public.experiment_measurements
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped notes" on public.experiment_notes;
create policy "workspace scoped notes" on public.experiment_notes
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped learnings" on public.learnings;
create policy "workspace scoped learnings" on public.learnings
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped ai_runs" on public.ai_runs;
create policy "workspace scoped ai_runs" on public.ai_runs
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace scoped usage" on public.usage_events;
create policy "workspace scoped usage" on public.usage_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

notify pgrst, 'reload schema';
