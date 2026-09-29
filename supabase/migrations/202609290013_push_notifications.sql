-- Push delivery for when the app is backgrounded or closed. A device
-- registers its Expo push token here; the notify-activity edge function
-- (called by the acting client right after fp_action) reads other members'
-- tokens and prefs with the service role, since a member must never be able
-- to read another member's token or preferences directly.
create table public.fp_push_tokens (
  user_id uuid not null references auth.users(id),
  token text not null check(length(token) between 1 and 200),
  updated_at timestamptz not null default now(),
  primary key(user_id, token)
);
create table public.fp_notification_prefs (
  user_id uuid primary key references auth.users(id),
  prefs jsonb not null default '{"requests":true,"decisions":true,"changes":false}',
  language text not null default 'es' check(language in ('es','en'))
);
alter table fp_push_tokens enable row level security;
alter table fp_notification_prefs enable row level security;
create policy push_token_owner on fp_push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_prefs_owner on fp_notification_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on fp_push_tokens, fp_notification_prefs from anon, authenticated;
grant select, insert, update, delete on fp_push_tokens to authenticated;
grant select, insert, update, delete on fp_notification_prefs to authenticated;

create function public.fp_register_push_token(p_token text) returns void
language sql security definer set search_path=public,pg_temp as $$
  insert into fp_push_tokens(user_id, token) values (auth.uid(), p_token)
  on conflict (user_id, token) do update set updated_at = now()
$$;
create function public.fp_unregister_push_token(p_token text) returns void
language sql security definer set search_path=public,pg_temp as $$
  delete from fp_push_tokens where user_id = auth.uid() and token = p_token
$$;
create function public.fp_set_notification_prefs(p_prefs jsonb, p_language text) returns void
language sql security definer set search_path=public,pg_temp as $$
  insert into fp_notification_prefs(user_id, prefs, language) values (auth.uid(), p_prefs, p_language)
  on conflict (user_id) do update set prefs = p_prefs, language = p_language
$$;
revoke execute on function fp_register_push_token(text), fp_unregister_push_token(text), fp_set_notification_prefs(jsonb,text) from public,anon;
grant execute on function fp_register_push_token(text), fp_unregister_push_token(text), fp_set_notification_prefs(jsonb,text) to authenticated;
