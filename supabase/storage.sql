insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'module-covers',
    'module-covers',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  ),
  (
    'module-media',
    'module-media',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "module_covers_public_read" on storage.objects;
drop policy if exists "module_covers_teacher_upload_own_folder" on storage.objects;
drop policy if exists "module_covers_teacher_update_own_folder" on storage.objects;
drop policy if exists "module_covers_teacher_delete_own_folder" on storage.objects;

drop policy if exists "module_media_public_read" on storage.objects;
drop policy if exists "module_media_teacher_upload_own_folder" on storage.objects;
drop policy if exists "module_media_teacher_update_own_folder" on storage.objects;
drop policy if exists "module_media_teacher_delete_own_folder" on storage.objects;

create policy "module_covers_public_read"
on storage.objects for select
to public
using (bucket_id = 'module-covers');

create policy "module_covers_teacher_upload_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'module-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "module_covers_teacher_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'module-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
)
with check (
  bucket_id = 'module-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "module_covers_teacher_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'module-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "module_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'module-media');

create policy "module_media_teacher_upload_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'module-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "module_media_teacher_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'module-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
)
with check (
  bucket_id = 'module-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "module_media_teacher_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'module-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);
