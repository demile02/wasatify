insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-media',
  'module-media',
  true,
  52428800,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read module media" on storage.objects;
create policy "Public can read module media"
on storage.objects for select
using (bucket_id = 'module-media');

drop policy if exists "Teachers can upload module media" on storage.objects;
create policy "Teachers can upload module media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'module-media'
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

drop policy if exists "Teachers can update module media" on storage.objects;
create policy "Teachers can update module media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'module-media'
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
)
with check (
  bucket_id = 'module-media'
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

drop policy if exists "Teachers can delete module media" on storage.objects;
create policy "Teachers can delete module media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'module-media'
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);
