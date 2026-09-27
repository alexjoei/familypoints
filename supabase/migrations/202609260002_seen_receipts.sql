-- A read receipt is not a vote. Only opening a proposal's detail records a receipt.
create table public.fp_seen_receipts (
  group_id uuid not null,
  proposal_id text not null,
  revision integer not null check(revision>0),
  actor uuid not null references auth.users(id),
  seen_at timestamptz not null default now(),
  primary key(group_id,proposal_id,revision,actor),
  foreign key(group_id,proposal_id) references public.fp_proposals(group_id,id)
);
alter table public.fp_seen_receipts enable row level security;
revoke all on public.fp_seen_receipts from anon,authenticated;
grant select on public.fp_seen_receipts to authenticated;
create policy seen_member_read on public.fp_seen_receipts for select to authenticated using(public.fp_is_member(group_id));
create function public.fp_mark_seen(p_group uuid,p_proposal text,p_revision integer) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p jsonb; stamp timestamptz;
begin
  if not fp_is_member(p_group) then raise exception 'not_member'; end if;
  select data into p from fp_proposals where group_id=p_group and id=p_proposal for share;
  if p is null then raise exception 'not_found'; end if;
  if p_revision is null or (p->>'revision')::integer<>p_revision then raise exception 'stale_revision'; end if;
  if not(p->'electorate' ? auth.uid()::text) then raise exception 'not_allowed'; end if;
  insert into fp_seen_receipts(group_id,proposal_id,revision,actor) values(p_group,p_proposal,p_revision,auth.uid()) on conflict do nothing;
  select seen_at into stamp from fp_seen_receipts where group_id=p_group and proposal_id=p_proposal and revision=p_revision and actor=auth.uid();
  return jsonb_build_object('actor',auth.uid(),'revision',p_revision,'at',stamp);
end $$;
revoke execute on function public.fp_mark_seen(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.fp_mark_seen(uuid,text,integer) to authenticated;
create or replace function public.fp_snapshot(p_group uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not fp_is_member(p_group) then raise exception 'not_member'; end if;
 select jsonb_build_object('id',g.id,'name',g.name,'owner',g.owner,'categories',g.categories,'templates',g.templates,
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',user_id,'name',name) order by name) from fp_members where group_id=g.id),'[]'),
 'proposals',coalesce((select jsonb_agg(p.data || jsonb_build_object('seen',coalesce((select jsonb_agg(jsonb_build_object('actor',r.actor,'revision',r.revision,'at',r.seen_at) order by r.seen_at) from fp_seen_receipts r where r.group_id=p.group_id and r.proposal_id=p.id),'[]')) order by p.created_at,p.id) from fp_proposals p where p.group_id=g.id),'[]'),
 'activity',coalesce((select jsonb_agg(data order by seq) from fp_activity where group_id=g.id),'[]')) into result from fp_groups g where id=p_group;
 return result;
end $$;
