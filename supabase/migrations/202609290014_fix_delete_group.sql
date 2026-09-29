-- Supabase blocks direct DML on storage.objects ("Direct deletion from
-- storage tables is not allowed. Use the Storage API instead."), even from
-- a security definer function owned by postgres. That made every call to
-- fp_delete_group fail, since the whole function is one transaction.
-- Orphaned photos are left in the private bucket; cleaning them up would
-- need a service-role call to the Storage API instead of raw SQL.
create or replace function public.fp_delete_group(p_group uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not exists(select 1 from fp_groups where id=p_group and owner=auth.uid()) then
    raise exception 'owner_only';
  end if;
  delete from fp_commands where group_id=p_group;
  delete from fp_activity where group_id=p_group;
  delete from fp_proposals where group_id=p_group;
  delete from fp_members where group_id=p_group;
  delete from fp_groups where id=p_group;
end $$;
