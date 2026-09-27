-- All writes go through authenticated RPCs. A group row lock serializes balance changes.
create table public.fp_groups (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 owner uuid not null references auth.users(id), categories jsonb not null default '[]', templates jsonb not null default '[]',
 invite text not null unique default replace(gen_random_uuid()::text,'-',''), invite_expires timestamptz not null default now()+interval '7 days'
);
create table public.fp_members (
 group_id uuid not null references public.fp_groups(id), user_id uuid not null references auth.users(id),
 name text not null check(length(name) between 1 and 60), primary key(group_id,user_id)
);
create table public.fp_proposals (
 group_id uuid not null references public.fp_groups(id), id text not null, data jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(group_id,id), check(data->>'id'=id), check(data->>'status' in ('pending','approved','rejected','withdrawn'))
);
create table public.fp_activity (
 seq bigint generated always as identity primary key, group_id uuid not null references public.fp_groups(id), data jsonb not null
);
create table public.fp_commands (
 group_id uuid not null references public.fp_groups(id), request_id uuid not null, actor uuid not null,
 command jsonb not null, primary key(group_id,request_id)
);
create index fp_members_user on public.fp_members(user_id);
create index fp_activity_group on public.fp_activity(group_id,seq);
create function public.fp_is_member(g uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from fp_members where group_id=g and user_id=auth.uid())
$$;
alter table fp_groups enable row level security;
alter table fp_members enable row level security;
alter table fp_proposals enable row level security;
alter table fp_activity enable row level security;
alter table fp_commands enable row level security;
-- Group table contains invitation secrets: only RPC snapshots expose sanitized fields.
create policy member_read on fp_members for select to authenticated using (fp_is_member(group_id));
create policy proposal_read on fp_proposals for select to authenticated using (fp_is_member(group_id));
create policy activity_read on fp_activity for select to authenticated using (fp_is_member(group_id));
revoke all on fp_groups,fp_members,fp_proposals,fp_activity,fp_commands from anon,authenticated;
grant select on fp_members,fp_proposals,fp_activity to authenticated;

create function public.fp_snapshot(p_group uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not fp_is_member(p_group) then raise exception 'not_member'; end if;
 select jsonb_build_object('id',g.id,'name',g.name,'owner',g.owner,'categories',g.categories,'templates',g.templates,
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',user_id,'name',name) order by name) from fp_members where group_id=g.id),'[]'),
 'proposals',coalesce((select jsonb_agg(data order by created_at,id) from fp_proposals where group_id=g.id),'[]'),
 'activity',coalesce((select jsonb_agg(data order by seq) from fp_activity where group_id=g.id),'[]')) into result from fp_groups g where id=p_group;
 return result;
end $$;
create function public.fp_my_groups() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',g.id,'name',g.name) order by g.name),'[]') from fp_groups g join fp_members m on m.group_id=g.id where m.user_id=auth.uid()
$$;
create function public.fp_event(g uuid, kind text, title text, points integer default null, proposal text default null) returns void language sql security definer set search_path=public,pg_temp as $$
 insert into fp_activity(group_id,data) values(g,jsonb_build_object('id',gen_random_uuid(),'actor',auth.uid(),'type',kind,'title',title,'points',points,'proposalId',proposal,'at',now()))
$$;
create function public.fp_create_group(p_name text, p_display_name text, p_language text default 'es') returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare g uuid; t jsonb; cats jsonb;
begin
 if auth.uid() is null then raise exception 'not_member'; end if;
 if length(trim(p_name)) not between 1 and 100 or length(trim(p_display_name)) not between 1 and 60 then raise exception 'invalid_text'; end if;
 if p_language='en' then
 t='[{"id":"template-0","title":"Make dinner","category":"Cooking","points":15},{"id":"template-1","title":"Wash the dishes","category":"Cleaning","points":10},{"id":"template-2","title":"Get the groceries","category":"Shopping","points":20},{"id":"template-3","title":"Handle an errand","category":"Errands","points":15},{"id":"template-4","title":"Take care of someone","category":"Care","points":20},{"id":"template-5","title":"Organize a plan","category":"Organizing","points":15},{"id":"template-6","title":"Lend a hand","category":"Favors","points":10}]';
 else
 t='[{"id":"template-0","title":"Preparar una cena","category":"Cocinar","points":15},{"id":"template-1","title":"Fregar los platos","category":"Limpieza","points":10},{"id":"template-2","title":"Hacer la compra","category":"Compra","points":20},{"id":"template-3","title":"Resolver una gestión","category":"Gestiones","points":15},{"id":"template-4","title":"Encargarse de un cuidado","category":"Cuidado","points":20},{"id":"template-5","title":"Organizar un plan","category":"Organización","points":15},{"id":"template-6","title":"Echar una mano","category":"Favores","points":10}]';
 end if;
 select jsonb_agg(value->'category') into cats from jsonb_array_elements(t);
 insert into fp_groups(name,owner,categories,templates) values(trim(p_name),auth.uid(),cats,t) returning id into g;
 insert into fp_members values(g,auth.uid(),trim(p_display_name));
 perform fp_event(g,'group_created',trim(p_name)); return g;
end $$;
create function public.fp_join_group(p_code text,p_display_name text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare g uuid;
begin
 if auth.uid() is null then raise exception 'not_member'; end if;
 if length(trim(p_display_name)) not between 1 and 60 then raise exception 'invalid_text'; end if;
 select id into g from fp_groups where invite=lower(trim(p_code)) and invite_expires>now() for update;
 if g is null then raise exception 'invalid_invite'; end if;
 if not exists(select 1 from fp_members where group_id=g and user_id=auth.uid()) then
 insert into fp_members values(g,auth.uid(),trim(p_display_name)); perform fp_event(g,'joined',trim(p_display_name));
 end if;
 return g;
end $$;
create function public.fp_invite(p_group uuid,p_rotate boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare g fp_groups;
begin
 select * into g from fp_groups where id=p_group and owner=auth.uid() for update;
 if g.id is null then raise exception 'owner_only'; end if;
 if p_rotate then
 update fp_groups set invite=replace(gen_random_uuid()::text,'-',''),invite_expires=now()+interval '7 days' where id=p_group returning * into g;
 perform fp_event(p_group,'invitation_rotated',g.name);
 end if;
 return jsonb_build_object('code',g.invite,'expires',g.invite_expires);
end $$;
create function public.fp_available(g uuid,a uuid) returns integer language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(sum(case when data->>'kind'='contribution' and data->>'status'='approved' then (data->>'points')::integer
 when data->>'kind'='redemption' and data->>'status' in ('approved','pending') then -(data->>'points')::integer else 0 end),0)::integer
 from fp_proposals where group_id=g and data->>'author'=a::text
$$;
create function public.fp_reward_cost(g uuid,r text) returns integer language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce((select (p.data->>'points')::integer from fp_activity e join fp_proposals p on p.group_id=e.group_id and p.id=e.data->>'proposalId'
 where e.group_id=g and e.data->>'type'='approved' and p.data->>'kind'='reward_change' and p.data->>'rewardId'=r order by e.seq desc limit 1),
 (select (data->>'points')::integer from fp_proposals where group_id=g and id=r and data->>'kind'='reward' and data->>'status'='approved'))
$$;

create function public.fp_action(p_group uuid,p_command jsonb,p_request uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare g fp_groups; p jsonb; c jsonb:=p_command; a text:=auth.uid()::text; op text:=c->>'type'; n integer;
 rid text:=c->>'id'; title text:=trim(c->>'title'); kind text:=c->>'kind'; points integer; elect jsonb;
 vcount integer; needed integer; newstatus text; prior fp_commands; r jsonb;
begin
 if not fp_is_member(p_group) then raise exception 'not_member'; end if;
 if octet_length(c::text)>16000 then raise exception 'invalid_text'; end if;
 select * into g from fp_groups where id=p_group for update;
 select * into prior from fp_commands where group_id=p_group and request_id=p_request;
 if found then
   if prior.actor::text<>a or prior.command<>c then raise exception 'duplicate'; end if;
   return fp_snapshot(p_group);
 end if;
 if op in ('submit','template','adjust','resubmit') then
   if coalesce(c->>'points','') !~ '^[0-9]{1,6}$' then raise exception 'invalid_points'; end if;
   points=(c->>'points')::integer;
   if points not between 1 and 100000 then raise exception 'invalid_points'; end if;
 end if;
 if op in ('submit','template','resubmit','category') and (title is null or length(title) not between 1 and 100) then raise exception 'invalid_text'; end if;
 if op in ('submit','resubmit') and (c->>'note' is null or length(c->>'note')>1000) then raise exception 'invalid_note'; end if;
 if op in ('template','category') then
   if g.owner::text<>a then raise exception 'owner_only'; end if;
   if op='category' then
     if length(title)>40 then raise exception 'invalid_text'; end if;
     if g.categories ? title then raise exception 'duplicate'; end if;
     update fp_groups set categories=categories || jsonb_build_array(title) where id=p_group;
   else
     if not coalesce(g.categories ? (c->>'category'),false) then raise exception 'invalid_category'; end if;
     if rid is null or length(rid)>100 then raise exception 'invalid_text'; end if;
     select coalesce(jsonb_agg(value),'[]') into r from jsonb_array_elements(g.templates) where value->>'id'<>rid;
     update fp_groups set templates=r || jsonb_build_array(jsonb_build_object('id',rid,'title',title,'category',c->>'category','points',points)) where id=p_group;
   end if;
   perform fp_event(p_group,op,title,points);
 elsif op='submit' then
   if kind not in ('contribution','reward','redemption','reward_change') or kind is null then raise exception 'not_allowed'; end if;
   if rid is null or length(rid) not between 1 and 100 then raise exception 'invalid_text'; end if;
   if exists(select 1 from fp_proposals where group_id=p_group and id=rid) then raise exception 'duplicate'; end if;
   if coalesce(c->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_date'; end if;
   begin perform (c->>'date')::date; exception when others then raise exception 'invalid_date'; end;
   if kind='contribution' then
     if not coalesce(g.categories ? (c->>'category'),false) then raise exception 'invalid_category'; end if;
     if c->>'templateId' is not null and not exists(select 1 from jsonb_array_elements(g.templates) t where t->>'id'=c->>'templateId' and t->>'category'=c->>'category') then raise exception 'invalid_template'; end if;
   end if;
   if kind in ('redemption','reward_change') then
     select data into r from fp_proposals where group_id=p_group and id=c->>'rewardId' and data->>'kind'='reward' and data->>'status'='approved';
     if r is null then raise exception 'invalid_reward'; end if;
     title=r->>'title';
     if kind='redemption' then
       points=fp_reward_cost(p_group,c->>'rewardId');
       if fp_available(p_group,auth.uid())<points then raise exception 'insufficient_balance'; end if;
     end if;
   end if;
   select coalesce(jsonb_agg(user_id),'[]') into elect from fp_members where group_id=p_group and user_id<>auth.uid();
   p=jsonb_build_object('id',rid,'kind',kind,'title',title,'points',points,'category',coalesce(c->>'category',''),'date',c->>'date','note',c->>'note','templateId',c->>'templateId','rewardId',c->>'rewardId','author',a,'status','pending','revision',1,'electorate',elect,'votes','[]'::jsonb);
   insert into fp_proposals(group_id,id,data) values(p_group,rid,p); perform fp_event(p_group,'submitted',title,points,rid);
 else
   select data into p from fp_proposals where group_id=p_group and id=rid;
   if p is null then raise exception 'not_found'; end if;
   if c->>'revision' is null or (p->>'revision')::integer<>(c->>'revision')::integer then raise exception 'stale_revision'; end if;
   title=p->>'title';
   if op='resubmit' then
     if p->>'author'<>a or p->>'status'<>'rejected' or p->>'kind'<>'contribution' then raise exception 'not_allowed'; end if;
     select coalesce(jsonb_agg(user_id),'[]') into elect from fp_members where group_id=p_group and user_id<>auth.uid();
     p=jsonb_set(p,'{history}',coalesce(p->'history','[]') || jsonb_build_array(p-'history'-'adjustment'));
     p=(p-'adjustment') || jsonb_build_object('title',trim(c->>'title'),'note',c->>'note','points',points,'status','pending','revision',(p->>'revision')::integer+1,'electorate',elect);
     perform fp_event(p_group,'resubmitted',p->>'title',points,rid);
   else
     if p->>'status'<>'pending' then raise exception 'already_closed'; end if;
     if op='withdraw' then
       if p->>'author'<>a then raise exception 'author_only'; end if;
       p=jsonb_set(p,'{status}','"withdrawn"'); perform fp_event(p_group,'withdrawn',title,(p->>'points')::integer,rid);
     elsif op='adjust' then
       if p->>'kind'='redemption' or not(p->'electorate' ? a) then raise exception 'not_allowed'; end if;
       if p ? 'adjustment' then raise exception 'adjustment_pending'; end if;
       p=jsonb_set(p,'{adjustment}',jsonb_build_object('actor',a,'points',points)); perform fp_event(p_group,'adjusted',title,points,rid);
     elsif op in ('accept_adjustment','decline_adjustment') then
       if p->>'author'<>a or not(p ? 'adjustment') then raise exception 'author_only'; end if;
       n=(p->'adjustment'->>'points')::integer;
       if op='accept_adjustment' then
         p=jsonb_set(p,'{history}',coalesce(p->'history','[]') || jsonb_build_array(p-'history'-'adjustment'));
         p=p || jsonb_build_object('points',n,'revision',(p->>'revision')::integer+1);
         perform fp_event(p_group,'adjustment_accepted',title,n,rid);
       else perform fp_event(p_group,'adjustment_declined',title,n,rid);
       end if;
       p=p-'adjustment';
     elsif op='vote' then
       if not(p->'electorate' ? a) then raise exception 'self_vote'; end if;
       if p ? 'adjustment' then raise exception 'adjustment_pending'; end if;
       if coalesce(c->>'choice','') not in ('approve','reject') then raise exception 'not_allowed'; end if;
       if exists(select 1 from jsonb_array_elements(p->'votes') v where v->>'actor'=a and v->>'revision'=p->>'revision') then raise exception 'already_voted'; end if;
       p=jsonb_set(p,'{votes}',(p->'votes') || jsonb_build_array(jsonb_build_object('actor',a,'choice',c->>'choice','revision',(p->>'revision')::integer,'at',now())));
       perform fp_event(p_group,case when c->>'choice'='approve' then 'voted_approve' else 'voted_reject' end,title,(p->>'points')::integer,rid);
       needed=jsonb_array_length(p->'electorate')/2+1;
       select count(*) into vcount from jsonb_array_elements(p->'votes') v where v->>'revision'=p->>'revision' and v->>'choice'=c->>'choice';
       if vcount>=needed then
         newstatus=case when c->>'choice'='approve' then 'approved' else 'rejected' end;
         p=jsonb_set(p,'{status}',to_jsonb(newstatus)); perform fp_event(p_group,newstatus,title,(p->>'points')::integer,rid);
         if newstatus='approved' and p->>'kind'='contribution' and p->>'templateId' is not null then
           select jsonb_agg(case when t->>'id'=p->>'templateId' then jsonb_set(t,'{points}',p->'points') else t end) into r from jsonb_array_elements(g.templates) t;
           update fp_groups set templates=r where id=p_group;
         end if;
       end if;
     else raise exception 'not_allowed';
     end if;
   end if;
   update fp_proposals set data=p where group_id=p_group and id=rid;
 end if;
 insert into fp_commands values(p_group,p_request,auth.uid(),c);
 return fp_snapshot(p_group);
end $$;

revoke execute on function fp_is_member(uuid),fp_snapshot(uuid),fp_my_groups(),fp_event(uuid,text,text,integer,text),fp_create_group(text,text,text),fp_join_group(text,text),fp_invite(uuid,boolean),fp_available(uuid,uuid),fp_reward_cost(uuid,text),fp_action(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function fp_is_member(uuid),fp_snapshot(uuid),fp_my_groups(),fp_create_group(text,text,text),fp_join_group(text,text),fp_invite(uuid,boolean),fp_action(uuid,jsonb,uuid) to authenticated;
