alter table public.evidence_items
  add column if not exists code text;

update public.evidence_items
  set code = coalesce(
    code,
    case type
      when 'ev_metric_photo_rate' then 'F-001'
      when 'ev_metric_share_rate' then 'F-002'
      when 'ev_funnel_dropoff' then 'F-003'
      when 'ev_signal_mobile' then 'S-001'
      when 'ev_unknown_share_delay' then 'I-001'
      when 'ev_metric_paid_conversion' then 'F-004'
    end
  )
where code is null;

with numbered_evidence as (
  select
    id,
    upper(left(classification, 1)) || '-' || lpad(row_number() over (
      partition by workspace_id, project_id, classification
      order by created_at, id
    )::text, 3, '0') as generated_code
  from public.evidence_items
  where code is null
)
update public.evidence_items evidence
  set code = numbered_evidence.generated_code
from numbered_evidence
where evidence.id = numbered_evidence.id;

alter table public.evidence_items
  alter column code set not null;

create index if not exists evidence_items_workspace_project_code_idx
  on public.evidence_items(workspace_id, project_id, code);

notify pgrst, 'reload schema';
