drop policy if exists "modules_select_authenticated" on public.modules;
create policy "modules_select_authenticated"
on public.modules for select
to authenticated
using (
  (select app_private.is_admin())
  or coalesce(created_by, teacher_id) = (select auth.uid())
  or (
    status = 'published'::public.module_status
    and (select app_private.is_student())
    and (
      is_public = true
      or class_id is null
      or class_id = (select app_private.current_profile_class_id())
    )
  )
);
