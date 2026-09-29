-- One delivery attempt per activity event, even if the client invokes the
-- Edge Function more than once or retries after a slow response.
create table public.fp_push_dispatches (
  group_id uuid not null,
  event_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (group_id, event_id)
);
alter table public.fp_push_dispatches enable row level security;
revoke all on public.fp_push_dispatches from public, anon, authenticated;

create function public.fp_claim_push_event(p_group uuid, p_event text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.fp_push_dispatches(group_id, event_id) values (p_group, p_event)
  on conflict do nothing;
  return found;
end;
$$;
revoke all on function public.fp_claim_push_event(uuid,text) from public, anon, authenticated;
grant execute on function public.fp_claim_push_event(uuid,text) to service_role;
