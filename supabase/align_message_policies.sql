drop policy if exists "messages_delete_teacher_own" on public.messages;
drop policy if exists "messages_insert_teacher_own" on public.messages;
drop policy if exists "messages_select_student_recipient_or_class" on public.messages;
drop policy if exists "messages_update_teacher_own" on public.messages;
drop policy if exists "messages_select_student_related" on public.messages;
drop policy if exists "messages_select_teacher_sent" on public.messages;
drop policy if exists "messages_insert_teacher_scoped" on public.messages;
drop policy if exists "messages_update_teacher_sent" on public.messages;
drop policy if exists "messages_delete_teacher_sent" on public.messages;

create policy "messages_select_student_related"
on public.messages for select
to authenticated
using (
  recipient_id = (select auth.uid())
  or (
    target_class_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'student'::public.app_role
        and p.class_id = messages.target_class_id
    )
  )
  or (recipient_id is null and target_class_id is null)
);

create policy "messages_select_teacher_sent"
on public.messages for select
to authenticated
using (sender_id = (select auth.uid()));

create policy "messages_insert_teacher_scoped"
on public.messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    public.is_admin()
    or (
      public.is_teacher()
      and (target_class_id is null or public.teacher_owns_class(target_class_id))
      and (recipient_id is null or public.teacher_can_read_student(recipient_id))
    )
  )
);

create policy "messages_update_teacher_sent"
on public.messages for update
to authenticated
using (sender_id = (select auth.uid()))
with check (
  sender_id = (select auth.uid())
  and (
    public.is_admin()
    or (
      public.is_teacher()
      and (target_class_id is null or public.teacher_owns_class(target_class_id))
      and (recipient_id is null or public.teacher_can_read_student(recipient_id))
    )
  )
);

create policy "messages_delete_teacher_sent"
on public.messages for delete
to authenticated
using (sender_id = (select auth.uid()) or public.is_admin());
