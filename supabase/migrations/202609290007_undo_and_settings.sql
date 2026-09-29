-- Keep decisions visible while allowing a rejected vote to be revoked.
create or replace function public.fp_action(p_group uuid,p_command jsonb,p_request uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
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
   if op='submit' and kind='debt_limit' then
     if points not between 0 and 100 then raise exception 'invalid_points'; end if;
   elsif points not between 1 and 100000 then raise exception 'invalid_points'; end if;
 end if;
 if op in ('submit','template','resubmit','category') and (title is null or length(title) not between 1 and 100) then raise exception 'invalid_text'; end if;
 if op in ('submit','resubmit') and (c->>'note' is null or length(c->>'note')>1000) then raise exception 'invalid_note'; end if;
 if op in ('template','category','remove_category','remove_template','remove_member') then
   if g.owner::text<>a then raise exception 'owner_only'; end if;
   if op='category' then
     if length(title)>40 then raise exception 'invalid_text'; end if;
     if g.categories ? title then raise exception 'duplicate'; end if;
     update fp_groups set categories=categories || jsonb_build_array(title) where id=p_group;
   elsif op='remove_category' then
     if not(g.categories ? title) then raise exception 'not_found'; end if;
     if exists(select 1 from jsonb_array_elements(g.templates) t where t->>'category'=title) then raise exception 'category_in_use'; end if;
     select coalesce(jsonb_agg(value),'[]') into r from jsonb_array_elements(g.categories) where value<>to_jsonb(title);
     update fp_groups set categories=r where id=p_group;
   elsif op='remove_template' then
     select value into r from jsonb_array_elements(g.templates) where value->>'id'=rid;
     if r is null then raise exception 'not_found'; end if;
     title=r->>'title';
     select coalesce(jsonb_agg(value),'[]') into r from jsonb_array_elements(g.templates) where value->>'id'<>rid;
     update fp_groups set templates=r where id=p_group;
   elsif op='remove_member' then
     if rid=g.owner::text then raise exception 'not_allowed'; end if;
     if exists(select 1 from fp_proposals where group_id=p_group and data->>'status'='pending') then raise exception 'pending_requests'; end if;
     select name into title from fp_members where group_id=p_group and user_id=rid::uuid;
     if title is null then raise exception 'not_found'; end if;
     delete from fp_members where group_id=p_group and user_id=rid::uuid;
   else
     if not coalesce(g.categories ? (c->>'category'),false) then raise exception 'invalid_category'; end if;
     if rid is null or length(rid)>100 then raise exception 'invalid_text'; end if;
     select coalesce(jsonb_agg(value),'[]') into r from jsonb_array_elements(g.templates) where value->>'id'<>rid;
     update fp_groups set templates=r || jsonb_build_array(jsonb_build_object('id',rid,'title',title,'category',c->>'category','points',points)) where id=p_group;
   end if;
   perform fp_event(p_group,op,title,points);
 elsif op='submit' then
   if kind not in ('contribution','reward','redemption','reward_change','debt_limit') or kind is null then raise exception 'not_allowed'; end if;
   if rid is null or length(rid) not between 1 and 100 then raise exception 'invalid_text'; end if;
   if exists(select 1 from fp_proposals where group_id=p_group and id=rid) then raise exception 'duplicate'; end if;
   if coalesce(c->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_date'; end if;
   begin perform (c->>'date')::date; exception when others then raise exception 'invalid_date'; end;
   if kind='contribution' then
     if not coalesce(g.categories ? (c->>'category'),false) then raise exception 'invalid_category'; end if;
     if c->>'templateId' is not null and not exists(select 1 from jsonb_array_elements(g.templates) t where t->>'id'=c->>'templateId' and t->>'category'=c->>'category') then raise exception 'invalid_template'; end if;
     if c->>'photoPath' is not null then
       if c->>'photoPath' <> p_group::text || '/' || a || '/' || rid || '.jpg' then raise exception 'invalid_photo'; end if;
       if not exists(select 1 from storage.objects where bucket_id='fp-contributions' and name=c->>'photoPath') then raise exception 'invalid_photo'; end if;
     end if;
   end if;
   if kind in ('redemption','reward_change') then
     select data into r from fp_proposals where group_id=p_group and id=c->>'rewardId' and data->>'kind'='reward' and data->>'status'='approved';
     if r is null then raise exception 'invalid_reward'; end if;
     title=r->>'title';
     if kind='redemption' then
       points=fp_reward_cost(p_group,c->>'rewardId');
       if fp_available(p_group,auth.uid())-points < -g.debt_limit then raise exception 'insufficient_balance'; end if;
     end if;
   end if;
   select coalesce(jsonb_agg(user_id),'[]') into elect from fp_members where group_id=p_group and user_id<>auth.uid();
   p=jsonb_build_object('id',rid,'kind',kind,'title',title,'points',points,'category',coalesce(c->>'category',''),'date',c->>'date','note',c->>'note','templateId',c->>'templateId','rewardId',c->>'rewardId','photoPath',c->>'photoPath','author',a,'status','pending','revision',1,'electorate',elect,'votes','[]'::jsonb);
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
     if op='undo_reject' then
       if p->>'status' not in ('rejected','pending') then raise exception 'already_closed'; end if;
       if not exists(select 1 from jsonb_array_elements(p->'votes') v where v->>'actor'=a and v->>'revision'=p->>'revision' and v->>'choice'='reject') then raise exception 'not_allowed'; end if;
       select v into elect from jsonb_array_elements(p->'votes') v where v->>'actor'=a and v->>'revision'=p->>'revision' and v->>'choice'='reject' limit 1;
       select coalesce(jsonb_agg(v),'[]') into r from jsonb_array_elements(p->'votes') v where not(v->>'actor'=a and v->>'revision'=p->>'revision' and v->>'choice'='reject');
       p=p || jsonb_build_object('votes',r,'status','pending','retractedVotes',coalesce(p->'retractedVotes','[]') || jsonb_build_array(elect));
       perform fp_event(p_group,'reject_undone',title,(p->>'points')::integer,rid);
     else
     if p->>'status'<>'pending' then raise exception 'already_closed'; end if;
     if op='withdraw' then
       if p->>'author'<>a then raise exception 'author_only'; end if;
       p=jsonb_set(p,'{status}','"withdrawn"'); perform fp_event(p_group,'withdrawn',title,(p->>'points')::integer,rid);
     elsif op='adjust' then
       if p->>'kind' in ('redemption','debt_limit') or not(p->'electorate' ? a) then raise exception 'not_allowed'; end if;
       if p ? 'adjustment' then raise exception 'adjustment_pending'; end if;
       p=jsonb_set(p,'{adjustment}',jsonb_build_object('actor',a,'points',points)); perform fp_event(p_group,'adjusted',title,points,rid);
     elsif op in ('accept_adjustment','decline_adjustment') then
       if p->>'author'<>a or not(p ? 'adjustment') then raise exception 'author_only'; end if;
       n=(p->'adjustment'->>'points')::integer;
       if op='accept_adjustment' then
         p=jsonb_set(p,'{history}',coalesce(p->'history','[]') || jsonb_build_array(p-'history'-'adjustment'));
         p=p || jsonb_build_object('points',n,'revision',(p->>'revision')::integer+1);
         perform fp_event(p_group,'adjustment_accepted',title,n,rid);
         if jsonb_array_length(p->'electorate')=1 then
           p=jsonb_set(p,'{votes}',p->'votes' || jsonb_build_array(jsonb_build_object('actor',p->'adjustment'->>'actor','choice','approve','revision',(p->>'revision')::integer,'at',now())));
           p=jsonb_set(p,'{status}','"approved"');
           perform fp_event(p_group,'approved',title,n,rid);
           if p->>'kind'='contribution' and p->>'templateId' is not null then
             select jsonb_agg(case when t->>'id'=p->>'templateId' then jsonb_set(t,'{points}',p->'points') else t end) into r from jsonb_array_elements(g.templates) t;
             update fp_groups set templates=r where id=p_group;
           end if;
         end if;
       else perform fp_event(p_group,'adjustment_declined',title,n,rid);
       end if;
       p=p-'adjustment';
     elsif op='vote' then
       if not(p->'electorate' ? a) then raise exception 'self_vote'; end if;
       if p ? 'adjustment' then raise exception 'adjustment_pending'; end if;
       if coalesce(c->>'choice','') not in ('approve','reject') then raise exception 'not_allowed'; end if;
       if exists(select 1 from jsonb_array_elements(p->'votes') v where v->>'actor'=a and v->>'revision'=p->>'revision') then raise exception 'already_voted'; end if;
       if length(coalesce(c->>'reason',''))>200 then raise exception 'invalid_note'; end if;
       p=jsonb_set(p,'{votes}',(p->'votes') || jsonb_build_array(jsonb_build_object('actor',a,'choice',c->>'choice','revision',(p->>'revision')::integer,'at',now(),'reason',case when c->>'choice'='reject' then nullif(trim(c->>'reason'),'') else null end)));
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
         if newstatus='approved' and p->>'kind'='debt_limit' then
           update fp_groups set debt_limit=(p->>'points')::integer where id=p_group;
         end if;
       end if;
     else raise exception 'not_allowed';
     end if;
     end if;
   end if;
   update fp_proposals set data=p where group_id=p_group and id=rid;
 end if;
 insert into fp_commands values(p_group,p_request,auth.uid(),c);
 return fp_snapshot(p_group);
end $$;

