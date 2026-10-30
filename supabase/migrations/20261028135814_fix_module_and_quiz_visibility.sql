alter policy quizzes_select_authenticated on public.quizzes using (
  (select app_private.is_admin())
  or ((select app_private.is_teacher()) and app_private.teacher_owns_module(module_id))
  or ((select app_private.is_student()) and (status='published' or is_published)
    and app_private.student_can_read_module(module_id,(select auth.uid())))
);
alter policy modules_select_authenticated on public.modules using (
  (select app_private.is_admin())
  or coalesce(created_by,teacher_id)=(select auth.uid())
  or ((select app_private.is_student()) and app_private.student_can_read_module(id,(select auth.uid())))
);
