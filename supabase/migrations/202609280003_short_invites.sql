-- Twelve random hex digits: compact to share, with 48 bits of entropy.
-- Existing invitations stay valid until their owner opens sharing or renews them.
alter table public.fp_groups
  alter column invite set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

create or replace function public.fp_invite(p_group uuid, p_rotate boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare g fp_groups;
begin
 select * into g from fp_groups where id=p_group and owner=auth.uid() for update;
 if g.id is null then raise exception 'owner_only'; end if;
 if p_rotate then
  update fp_groups
     set invite=substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
         invite_expires=now()+interval '7 days'
   where id=p_group returning * into g;
  perform fp_event(p_group,'invitation_rotated',g.name);
 end if;
 return jsonb_build_object('code',g.invite,'expires',g.invite_expires);
end $$;

create or replace function public.fp_join_group(p_code text,p_display_name text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare g uuid;
begin
 if auth.uid() is null then raise exception 'not_member'; end if;
 if length(trim(p_display_name)) not between 1 and 60 then raise exception 'invalid_text'; end if;
 select id into g from fp_groups
  where invite=lower(regexp_replace(trim(p_code),'[[:space:]-]','','g'))
    and invite_expires>now()
  for update;
 if g is null then raise exception 'invalid_invite'; end if;
 if not exists(select 1 from fp_members where group_id=g and user_id=auth.uid()) then
  insert into fp_members values(g,auth.uid(),trim(p_display_name));
  perform fp_event(g,'joined',trim(p_display_name));
 end if;
 return g;
end $$;
