create table if not exists public.ai_usage_daily (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  usage_date date not null,
  quantity integer not null default 0 check (quantity >= 0),
  daily_limit integer not null check (daily_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id, event_type, usage_date)
);

alter table public.ai_usage_daily enable row level security;

grant select on public.ai_usage_daily to authenticated;
grant all privileges on public.ai_usage_daily to service_role;

drop policy if exists "workspace scoped ai_usage_daily" on public.ai_usage_daily;
create policy "workspace scoped ai_usage_daily" on public.ai_usage_daily
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and public.is_workspace_member(workspace_id)
  );

create or replace function public.reserve_ai_usage(
  p_workspace_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_quantity integer,
  p_limit integer
)
returns table(allowed boolean, used integer, daily_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_date date := (now() at time zone 'utc')::date;
  v_current_quantity integer;
begin
  if p_quantity < 1 then
    raise exception 'p_quantity must be positive';
  end if;

  if p_limit < 1 then
    allowed := false;
    used := 0;
    daily_limit := p_limit;
    return next;
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(p_workspace_id::text || ':' || p_user_id::text || ':' || p_event_type || ':' || v_usage_date::text)
  );

  select quantity
    into v_current_quantity
  from public.ai_usage_daily
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and event_type = p_event_type
    and usage_date = v_usage_date
  for update;

  if v_current_quantity is null then
    if p_quantity > p_limit then
      allowed := false;
      used := 0;
      daily_limit := p_limit;
      return next;
      return;
    end if;

    insert into public.ai_usage_daily (
      workspace_id,
      user_id,
      event_type,
      usage_date,
      quantity,
      daily_limit
    )
    values (
      p_workspace_id,
      p_user_id,
      p_event_type,
      v_usage_date,
      p_quantity,
      p_limit
    );

    allowed := true;
    used := p_quantity;
    daily_limit := p_limit;
    return next;
    return;
  end if;

  if v_current_quantity + p_quantity > p_limit then
    update public.ai_usage_daily
      set daily_limit = p_limit,
          updated_at = now()
    where workspace_id = p_workspace_id
      and user_id = p_user_id
      and event_type = p_event_type
      and usage_date = v_usage_date;

    allowed := false;
    used := v_current_quantity;
    daily_limit := p_limit;
    return next;
    return;
  end if;

  update public.ai_usage_daily
    set quantity = quantity + p_quantity,
        daily_limit = p_limit,
        updated_at = now()
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and event_type = p_event_type
    and usage_date = v_usage_date
  returning quantity into v_current_quantity;

  allowed := true;
  used := v_current_quantity;
  daily_limit := p_limit;
  return next;
end;
$$;

create or replace function public.release_ai_usage(
  p_workspace_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_date date := (now() at time zone 'utc')::date;
begin
  if p_quantity < 1 then
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(p_workspace_id::text || ':' || p_user_id::text || ':' || p_event_type || ':' || v_usage_date::text)
  );

  update public.ai_usage_daily
    set quantity = greatest(0, quantity - p_quantity),
        updated_at = now()
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and event_type = p_event_type
    and usage_date = v_usage_date;
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.release_ai_usage(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, uuid, text, integer, integer) to service_role;
grant execute on function public.release_ai_usage(uuid, uuid, text, integer) to service_role;

notify pgrst, 'reload schema';
