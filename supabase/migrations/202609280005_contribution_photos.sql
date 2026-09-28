-- Private, small JPEG attachments. Only group members may read them; only the
-- uploading member may create, replace or remove a file in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fp-contributions', 'fp-contributions', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy fp_photo_read on storage.objects for select to authenticated using (
  bucket_id='fp-contributions' and
  case when split_part(name,'/',1) ~ '^[0-9a-f-]{36}$'
    then public.fp_is_member(split_part(name,'/',1)::uuid)
    else false end
);

create policy fp_photo_insert on storage.objects for insert to authenticated with check (
  bucket_id='fp-contributions' and
  name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' and
  split_part(name,'/',2)=auth.uid()::text and
  case when split_part(name,'/',1) ~ '^[0-9a-f-]{36}$'
    then public.fp_is_member(split_part(name,'/',1)::uuid)
    else false end
);

create policy fp_photo_update on storage.objects for update to authenticated using (
  bucket_id='fp-contributions' and split_part(name,'/',2)=auth.uid()::text
) with check (
  bucket_id='fp-contributions' and split_part(name,'/',2)=auth.uid()::text and
  case when split_part(name,'/',1) ~ '^[0-9a-f-]{36}$'
    then public.fp_is_member(split_part(name,'/',1)::uuid)
    else false end
);

create policy fp_photo_delete on storage.objects for delete to authenticated using (
  bucket_id='fp-contributions' and split_part(name,'/',2)=auth.uid()::text
);
