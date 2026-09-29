-- Owner-only, irreversible: removes the group and everything that depended on
-- it, including private photos, so no orphaned rows or storage files remain.
create or replace function public.fp_delete_group(p_group uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not exists(select 1 from fp_groups where id=p_group and owner=auth.uid()) then
    raise exception 'owner_only';
  end if;
  delete from storage.objects where bucket_id='fp-contributions' and split_part(name,'/',1)=p_group::text;
  delete from fp_commands where group_id=p_group;
  delete from fp_activity where group_id=p_group;
  delete from fp_proposals where group_id=p_group;
  delete from fp_members where group_id=p_group;
  delete from fp_groups where id=p_group;
end $$;
revoke execute on function fp_delete_group(uuid) from public,anon,authenticated;
grant execute on function fp_delete_group(uuid) to authenticated;
