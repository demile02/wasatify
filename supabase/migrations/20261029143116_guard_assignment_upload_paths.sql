drop policy assignment_submission_files_upload_scoped on storage.objects;
create policy assignment_submission_files_upload_scoped
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ (
    '^' || (select auth.uid())::text || '/' || (storage.foldername(name))[2]
    || '/[0-9a-fA-F-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|webp)$'
  )
  and app_private.is_student()
  and exists (
    select 1
    from public.class_assignments a
    where a.id::text = (storage.foldername(name))[2]
      and a.class_id = (select app_private.current_profile_class_id())
  )
);

drop policy assignment_submission_files_delete_scoped on storage.objects;
create policy assignment_submission_files_delete_scoped
on storage.objects for delete
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ (
    '^' || (select auth.uid())::text || '/' || (storage.foldername(name))[2]
    || '/[0-9a-fA-F-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|webp)$'
  )
  and app_private.is_student()
  and exists (
    select 1
    from public.class_assignments a
    where a.id::text = (storage.foldername(name))[2]
      and a.class_id = (select app_private.current_profile_class_id())
  )
  and not exists (
    select 1
    from public.assignment_submissions s
    where s.file_path = storage.objects.name
      and s.status = 'reviewed'
  )
);
