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
    array[
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  ),
  (
    'media-assets',
    'media-assets',
    true,
    52428800,
    array[
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  ),
  (
    'profile-avatars',
    'profile-avatars',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp']
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
drop policy if exists "media_assets_public_read" on storage.objects;
drop policy if exists "media_assets_teacher_upload_own_folder" on storage.objects;
drop policy if exists "media_assets_teacher_update_own_folder" on storage.objects;
drop policy if exists "media_assets_teacher_delete_own_folder" on storage.objects;
drop policy if exists "profile_avatars_public_read" on storage.objects;
drop policy if exists "profile_avatars_upload_own_folder" on storage.objects;
drop policy if exists "profile_avatars_update_own_folder" on storage.objects;
drop policy if exists "profile_avatars_delete_own_folder" on storage.objects;

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

create policy "media_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'media-assets');

create policy "media_assets_teacher_upload_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media-assets'
  and (storage.foldername(name))[1] = 'teacher'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "media_assets_teacher_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'media-assets'
  and (storage.foldername(name))[1] = 'teacher'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
)
with check (
  bucket_id = 'media-assets'
  and (storage.foldername(name))[1] = 'teacher'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "media_assets_teacher_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media-assets'
  and (storage.foldername(name))[1] = 'teacher'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (public.is_teacher() or public.is_admin())
);

create policy "profile_avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'profile-avatars');

create policy "profile_avatars_upload_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "profile_avatars_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "profile_avatars_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);
