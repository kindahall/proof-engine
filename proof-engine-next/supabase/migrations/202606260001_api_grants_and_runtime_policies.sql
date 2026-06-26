grant usage on schema public to anon, authenticated, service_role;

grant select on public.profiles to authenticated;
grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.data_sources to authenticated;
grant select on public.sync_runs to authenticated;
grant select on public.connector_health_checks to authenticated;
grant select, insert, update, delete on public.gateway_profiles to authenticated;
grant select on public.gateway_capability_checks to authenticated;
grant select on public.gateway_tool_runs to authenticated;
grant select on public.source_schemas to authenticated;
grant select, insert, update, delete on public.event_mappings to authenticated;
grant select on public.raw_events to authenticated;
grant select on public.project_metrics to authenticated;
grant select on public.metric_snapshots to authenticated;
grant select on public.funnel_snapshots to authenticated;
grant select, insert, update, delete on public.evidence_items to authenticated;
grant select, insert, update, delete on public.diagnostics to authenticated;
grant select, insert, update, delete on public.experiments to authenticated;
grant select, insert, update, delete on public.experiment_assets to authenticated;
grant select on public.experiment_measurements to authenticated;
grant select, insert, update, delete on public.experiment_notes to authenticated;
grant select, insert, update, delete on public.learnings to authenticated;
grant select on public.ai_runs to authenticated;
grant select on public.usage_events to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
