create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create or replace function app_private.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function app_private.current_profile_class_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.class_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_profile_role() = 'admin'::public.app_role, false)
$$;

create or replace function app_private.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_profile_role() = 'teacher'::public.app_role, false)
$$;

create or replace function app_private.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_profile_role() = 'student'::public.app_role, false)
$$;

create or replace function app_private.teacher_owns_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = auth.uid()
  )
$$;

create or replace function app_private.teacher_can_read_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles s
    join public.classes c on c.id = s.class_id
    where s.id = target_student_id
      and s.role = 'student'::public.app_role
      and c.teacher_id = auth.uid()
  )
$$;

create or replace function app_private.teacher_owns_module(target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.modules m
    where m.id = target_module_id
      and coalesce(m.created_by, m.teacher_id) = auth.uid()
  )
$$;

create or replace function app_private.teacher_owns_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quizzes q
    left join public.modules m on m.id = q.module_id
    where q.id = target_quiz_id
      and (q.teacher_id = auth.uid() or coalesce(m.created_by, m.teacher_id) = auth.uid())
  )
$$;

create or replace function app_private.student_can_read_module(target_module_id uuid, target_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.modules m
    join public.profiles s on s.id = target_student_id and s.role = 'student'
    join public.classes c on c.id = s.class_id
    where m.id = target_module_id and m.status = 'published'
      and coalesce(m.created_by, m.teacher_id) = c.teacher_id
  )
$$;

create or replace function app_private.lesson_belongs_to_module(target_lesson_id uuid, target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    where l.id = target_lesson_id
      and l.module_id = target_module_id
  )
$$;

create or replace function app_private.student_can_attempt_quiz(target_quiz_id uuid, target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = target_quiz_id
      and (q.status = 'published'::public.quiz_status or q.is_published = true)
      and app_private.student_can_read_module(q.module_id, target_student_id)
  )
$$;
revoke all on function app_private.current_profile_role() from public, anon;
grant execute on function app_private.current_profile_role() to authenticated;
revoke all on function app_private.current_profile_class_id() from public, anon;
grant execute on function app_private.current_profile_class_id() to authenticated;
revoke all on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated;
revoke all on function app_private.is_teacher() from public, anon;
grant execute on function app_private.is_teacher() to authenticated;
revoke all on function app_private.is_student() from public, anon;
grant execute on function app_private.is_student() to authenticated;
revoke all on function app_private.teacher_owns_class(uuid) from public, anon;
grant execute on function app_private.teacher_owns_class(uuid) to authenticated;
revoke all on function app_private.teacher_can_read_student(uuid) from public, anon;
grant execute on function app_private.teacher_can_read_student(uuid) to authenticated;
revoke all on function app_private.teacher_owns_module(uuid) from public, anon;
grant execute on function app_private.teacher_owns_module(uuid) to authenticated;
revoke all on function app_private.teacher_owns_quiz(uuid) from public, anon;
grant execute on function app_private.teacher_owns_quiz(uuid) to authenticated;
revoke all on function app_private.student_can_read_module(uuid, uuid) from public, anon;
grant execute on function app_private.student_can_read_module(uuid, uuid) to authenticated;
revoke all on function app_private.lesson_belongs_to_module(uuid, uuid) from public, anon;
grant execute on function app_private.lesson_belongs_to_module(uuid, uuid) to authenticated;
revoke all on function app_private.student_can_attempt_quiz(uuid, uuid) from public, anon;
grant execute on function app_private.student_can_attempt_quiz(uuid, uuid) to authenticated;
revoke all on function app_private.lock_valid_teacher_invite_code(text) from public, anon, authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'classes',
        'teacher_invite_codes',
        'modules',
        'lessons',
        'quizzes',
        'quiz_questions',
        'module_progress',
        'lesson_progress',
        'quiz_attempts',
        'reflections',
        'achievements',
        'student_achievements',
        'announcements',
        'notification_reads',
        'messages',
        'message_reads',
        'media_assets',
        'infographic_assets'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_invite_codes enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.module_progress enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.reflections enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.announcements enable row level security;
alter table public.notification_reads enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.media_assets enable row level security;
alter table public.infographic_assets enable row level security;

create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles_select_teacher_students"
on public.profiles for select
to authenticated
using (app_private.is_teacher() and app_private.teacher_can_read_student(id));

create policy "profiles_update_own_without_role_escalation"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and role = app_private.current_profile_role()
  and class_id is not distinct from app_private.current_profile_class_id()
);

create policy "classes_admin_all"
on public.classes for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

revoke select on public.classes from anon;
revoke execute on function public.validate_teacher_invite_code(text) from public;
revoke execute on function public.validate_class_code(text) from public;
grant execute on function public.validate_teacher_invite_code(text) to anon, authenticated;
grant execute on function public.validate_class_code(text) to anon, authenticated;

create policy "teacher_invite_codes_admin_all"
on public.teacher_invite_codes for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "teacher_invite_codes_select_related"
on public.teacher_invite_codes for select
to authenticated
using (created_by = (select auth.uid()) or used_by = (select auth.uid()) or app_private.is_admin());

create policy "classes_select_related"
on public.classes for select
to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.class_id = classes.id
  )
);

create policy "classes_insert_teacher_own"
on public.classes for insert
to authenticated
with check (app_private.is_teacher() and teacher_id = (select auth.uid()));

create policy "classes_update_teacher_own"
on public.classes for update
to authenticated
using (app_private.is_teacher() and teacher_id = (select auth.uid()))
with check (app_private.is_teacher() and teacher_id = (select auth.uid()));

create policy "classes_delete_teacher_own"
on public.classes for delete
to authenticated
using (app_private.is_teacher() and teacher_id = (select auth.uid()));

drop policy if exists "modules_admin_all" on public.modules;
drop policy if exists "modules_select_student_published_or_teacher_own" on public.modules;
drop policy if exists "modules_insert_teacher_own" on public.modules;
drop policy if exists "modules_update_teacher_own" on public.modules;
drop policy if exists "modules_delete_teacher_own" on public.modules;

create policy "modules_admin_all"
on public.modules for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "modules_select_student_published_or_teacher_own"
on public.modules for select
to authenticated
using (
  coalesce(created_by, teacher_id) = (select auth.uid())
  or ((select app_private.is_student()) and app_private.student_can_read_module(id, (select auth.uid())))
);

create policy "modules_insert_teacher_own"
on public.modules for insert
to authenticated
with check (
  app_private.is_teacher()
  and coalesce(created_by, teacher_id) = (select auth.uid())
  and (teacher_id is null or teacher_id = (select auth.uid()))
  and (class_id is null or app_private.teacher_owns_class(class_id))
);

create policy "modules_update_teacher_own"
on public.modules for update
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_module(id))
with check (
  app_private.is_teacher()
  and coalesce(created_by, teacher_id) = (select auth.uid())
  and (teacher_id is null or teacher_id = (select auth.uid()))
  and (class_id is null or app_private.teacher_owns_class(class_id))
);

create policy "modules_delete_teacher_own"
on public.modules for delete
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_module(id));

drop policy if exists "lessons_admin_all" on public.lessons;
drop policy if exists "lessons_select_student_or_teacher" on public.lessons;
drop policy if exists "lessons_insert_teacher_module" on public.lessons;
drop policy if exists "lessons_update_teacher_module" on public.lessons;
drop policy if exists "lessons_delete_teacher_module" on public.lessons;

create policy "lessons_admin_all"
on public.lessons for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "lessons_select_allowed_module"
on public.lessons for select
to authenticated
using (
  app_private.teacher_owns_module(module_id)
  or app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "lessons_insert_teacher_module"
on public.lessons for insert
to authenticated
with check (app_private.is_teacher() and app_private.teacher_owns_module(module_id));

create policy "lessons_update_teacher_module"
on public.lessons for update
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_module(module_id))
with check (app_private.is_teacher() and app_private.teacher_owns_module(module_id));

create policy "lessons_delete_teacher_module"
on public.lessons for delete
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_module(module_id));

drop policy if exists "quizzes_admin_all" on public.quizzes;
drop policy if exists "quizzes_select_student_or_teacher" on public.quizzes;
drop policy if exists "quizzes_insert_teacher_module" on public.quizzes;
drop policy if exists "quizzes_update_teacher_module" on public.quizzes;
drop policy if exists "quizzes_delete_teacher_module" on public.quizzes;

create policy "quizzes_admin_all"
on public.quizzes for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "quizzes_select_allowed"
on public.quizzes for select
to authenticated
using (
  ((select app_private.is_teacher()) and app_private.teacher_owns_module(module_id))
  or ((status = 'published'::public.quiz_status or is_published) and app_private.student_can_read_module(module_id, (select auth.uid())))
);

create policy "quizzes_insert_teacher_module"
on public.quizzes for insert
to authenticated
with check (
  app_private.is_teacher()
  and teacher_id = (select auth.uid())
  and app_private.teacher_owns_module(module_id)
);

create policy "quizzes_update_teacher_own"
on public.quizzes for update
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_quiz(id))
with check (
  app_private.is_teacher()
  and teacher_id = (select auth.uid())
  and app_private.teacher_owns_module(module_id)
);

create policy "quizzes_delete_teacher_own"
on public.quizzes for delete
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_quiz(id));

drop policy if exists "quiz_questions_admin_all" on public.quiz_questions;
drop policy if exists "quiz_questions_select_student_or_teacher" on public.quiz_questions;
drop policy if exists "quiz_questions_insert_teacher_quiz" on public.quiz_questions;
drop policy if exists "quiz_questions_update_teacher_quiz" on public.quiz_questions;
drop policy if exists "quiz_questions_delete_teacher_quiz" on public.quiz_questions;

create policy "quiz_questions_admin_all"
on public.quiz_questions for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "quiz_questions_select_teacher_only"
on public.quiz_questions for select
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_select_student_published_quiz"
on public.quiz_questions for select
to authenticated
using (
  app_private.is_student()
  and app_private.student_can_attempt_quiz(quiz_id, (select auth.uid()))
);

create policy "quiz_questions_insert_teacher_quiz"
on public.quiz_questions for insert
to authenticated
with check (app_private.is_teacher() and app_private.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_update_teacher_quiz"
on public.quiz_questions for update
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_quiz(quiz_id))
with check (app_private.is_teacher() and app_private.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_delete_teacher_quiz"
on public.quiz_questions for delete
to authenticated
using (app_private.is_teacher() and app_private.teacher_owns_quiz(quiz_id));

create policy "module_progress_admin_all"
on public.module_progress for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "module_progress_select_own_or_teacher_class"
on public.module_progress for select
to authenticated
using (
  student_id = (select auth.uid())
  or (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
);

create policy "module_progress_insert_own"
on public.module_progress for insert
to authenticated
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "module_progress_update_own"
on public.module_progress for update
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()))
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "module_progress_delete_own"
on public.module_progress for delete
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()));

drop policy if exists "module_progress_delete_teacher_class" on public.module_progress;
create policy "module_progress_delete_teacher_class"
on public.module_progress for delete
to authenticated
using (
  app_private.is_teacher()
  and app_private.teacher_can_read_student(student_id)
  and app_private.teacher_owns_module(module_id)
);

create policy "lesson_progress_admin_all"
on public.lesson_progress for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "lesson_progress_select_own_or_teacher_class"
on public.lesson_progress for select
to authenticated
using (
  student_id = (select auth.uid())
  or (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
);

create policy "lesson_progress_insert_own"
on public.lesson_progress for insert
to authenticated
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.lesson_belongs_to_module(lesson_id, module_id)
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "lesson_progress_update_own"
on public.lesson_progress for update
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()))
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.lesson_belongs_to_module(lesson_id, module_id)
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "lesson_progress_delete_own"
on public.lesson_progress for delete
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()));

drop policy if exists "lesson_progress_delete_teacher_class" on public.lesson_progress;
create policy "lesson_progress_delete_teacher_class"
on public.lesson_progress for delete
to authenticated
using (
  app_private.is_teacher()
  and app_private.teacher_can_read_student(student_id)
  and app_private.teacher_owns_module(module_id)
);

create policy "quiz_attempts_admin_all"
on public.quiz_attempts for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "quiz_attempts_select_own_or_teacher_class"
on public.quiz_attempts for select
to authenticated
using (
  student_id = (select auth.uid())
  or (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
);

create policy "quiz_attempts_insert_own"
on public.quiz_attempts for insert
to authenticated
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and status in ('in_progress'::public.quiz_attempt_status, 'submitted'::public.quiz_attempt_status, 'graded'::public.quiz_attempt_status)
  and app_private.student_can_attempt_quiz(quiz_id, (select auth.uid()))
);

create policy "quiz_attempts_update_own"
on public.quiz_attempts for update
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()))
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.student_can_attempt_quiz(quiz_id, (select auth.uid()))
);

create policy "quiz_attempts_delete_own"
on public.quiz_attempts for delete
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()));

drop policy if exists "quiz_attempts_delete_teacher_class" on public.quiz_attempts;
create policy "quiz_attempts_delete_teacher_class"
on public.quiz_attempts for delete
to authenticated
using (
  app_private.is_teacher()
  and app_private.teacher_can_read_student(student_id)
  and exists (
    select 1
    from public.quizzes q
    join public.modules m on m.id = q.module_id
    where q.id = quiz_attempts.quiz_id
      and coalesce(m.created_by, m.teacher_id) = (select auth.uid())
  )
);

create policy "reflections_admin_all"
on public.reflections for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "reflections_select_own_or_teacher_class"
on public.reflections for select
to authenticated
using (
  student_id = (select auth.uid())
  or (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
);

create policy "reflections_insert_own"
on public.reflections for insert
to authenticated
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "reflections_update_own"
on public.reflections for update
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()))
with check (
  app_private.is_student()
  and student_id = (select auth.uid())
  and app_private.student_can_read_module(module_id, (select auth.uid()))
);

create policy "reflections_update_teacher_review"
on public.reflections for update
to authenticated
using (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
with check (app_private.is_teacher() and app_private.teacher_can_read_student(student_id));

create policy "reflections_delete_own"
on public.reflections for delete
to authenticated
using (app_private.is_student() and student_id = (select auth.uid()));

drop policy if exists "reflections_delete_teacher_class" on public.reflections;
create policy "reflections_delete_teacher_class"
on public.reflections for delete
to authenticated
using (
  app_private.is_teacher()
  and app_private.teacher_can_read_student(student_id)
  and app_private.teacher_owns_module(module_id)
);

create policy "achievements_admin_all"
on public.achievements for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "achievements_select_authenticated"
on public.achievements for select
to authenticated
using (true);

create policy "student_achievements_admin_all"
on public.student_achievements for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "student_achievements_select_own_or_teacher_class"
on public.student_achievements for select
to authenticated
using (
  student_id = (select auth.uid())
  or (app_private.is_teacher() and app_private.teacher_can_read_student(student_id))
);

create policy "student_achievements_insert_own"
on public.student_achievements for insert
to authenticated
with check (app_private.is_student() and student_id = (select auth.uid()));

create policy "announcements_admin_all"
on public.announcements for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "announcements_select_related"
on public.announcements for select
to authenticated
using (
  teacher_id = (select auth.uid())
  or (
    coalesce(status, 'draft') = 'published'
    and published_at is not null
    and published_at <= now()
    and (
      class_id is null
      or exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.class_id = announcements.class_id
      )
    )
  )
);

create policy "announcements_insert_teacher_own"
on public.announcements for insert
to authenticated
with check (
  app_private.is_teacher()
  and teacher_id = (select auth.uid())
  and (class_id is null or app_private.teacher_owns_class(class_id))
);

create policy "announcements_update_teacher_own"
on public.announcements for update
to authenticated
using (app_private.is_teacher() and teacher_id = (select auth.uid()))
with check (
  app_private.is_teacher()
  and teacher_id = (select auth.uid())
  and (class_id is null or app_private.teacher_owns_class(class_id))
);

create policy "announcements_delete_teacher_own"
on public.announcements for delete
to authenticated
using (app_private.is_teacher() and teacher_id = (select auth.uid()));

create policy "notification_reads_admin_all"
on public.notification_reads for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "notification_reads_select_own"
on public.notification_reads for select
to authenticated
using (user_id = (select auth.uid()));

create policy "notification_reads_insert_own"
on public.notification_reads for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "notification_reads_update_own"
on public.notification_reads for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "notification_reads_delete_own"
on public.notification_reads for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "messages_admin_all"
on public.messages for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

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
    app_private.is_admin()
    or (
      app_private.is_teacher()
      and (
        target_class_id is null
        or app_private.teacher_owns_class(target_class_id)
      )
      and (
        recipient_id is null
        or app_private.teacher_can_read_student(recipient_id)
      )
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
    app_private.is_admin()
    or (
      app_private.is_teacher()
      and (target_class_id is null or app_private.teacher_owns_class(target_class_id))
      and (recipient_id is null or app_private.teacher_can_read_student(recipient_id))
    )
  )
);

create policy "messages_delete_teacher_sent"
on public.messages for delete
to authenticated
using (sender_id = (select auth.uid()) or app_private.is_admin());

create policy "message_reads_admin_all"
on public.message_reads for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "message_reads_select_own"
on public.message_reads for select
to authenticated
using (user_id = (select auth.uid()));

create policy "message_reads_insert_own"
on public.message_reads for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "message_reads_update_own"
on public.message_reads for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "message_reads_delete_own"
on public.message_reads for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "media_assets_admin_all"
on public.media_assets for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "media_assets_select_allowed"
on public.media_assets for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (module_id is not null and app_private.teacher_owns_module(module_id))
  or (module_id is not null and app_private.student_can_read_module(module_id, (select auth.uid())))
);

create policy "media_assets_insert_teacher_or_owner"
on public.media_assets for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and (
    kind = 'avatar'::public.media_kind
    or (app_private.is_teacher() and (module_id is null or app_private.teacher_owns_module(module_id)))
  )
);

create policy "media_assets_update_owner_or_teacher_module"
on public.media_assets for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (app_private.is_teacher() and module_id is not null and app_private.teacher_owns_module(module_id))
)
with check (
  owner_id = (select auth.uid())
  or (app_private.is_teacher() and module_id is not null and app_private.teacher_owns_module(module_id))
);

create policy "media_assets_delete_owner_or_teacher_module"
on public.media_assets for delete
to authenticated
using (
  owner_id = (select auth.uid())
  or (app_private.is_teacher() and module_id is not null and app_private.teacher_owns_module(module_id))
);

create policy "infographic_assets_admin_all"
on public.infographic_assets for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "infographic_assets_select_allowed"
on public.infographic_assets for select
to authenticated
using (
  created_by = (select auth.uid())
  or (module_id is not null and app_private.teacher_owns_module(module_id))
  or (module_id is not null and app_private.student_can_read_module(module_id, (select auth.uid())))
  or (lesson_id is not null and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and app_private.student_can_read_module(l.module_id, (select auth.uid()))
  ))
);

create policy "infographic_assets_insert_teacher_own"
on public.infographic_assets for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (app_private.is_teacher() or app_private.is_admin())
  and (module_id is null or app_private.teacher_owns_module(module_id))
);

create policy "infographic_assets_update_teacher_own"
on public.infographic_assets for update
to authenticated
using (
  created_by = (select auth.uid())
  or (module_id is not null and app_private.teacher_owns_module(module_id))
)
with check (
  created_by = (select auth.uid())
  and (module_id is null or app_private.teacher_owns_module(module_id))
);

create policy "infographic_assets_delete_teacher_own"
on public.infographic_assets for delete
to authenticated
using (
  created_by = (select auth.uid())
  or (module_id is not null and app_private.teacher_owns_module(module_id))
);

drop table if exists pg_temp._wasatify_policy_snapshot;
drop table if exists pg_temp._wasatify_policy_target;

create temporary table _wasatify_policy_snapshot as
select schemaname, tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'classes', 'teacher_invite_codes', 'modules', 'lessons',
    'quizzes', 'quiz_questions', 'module_progress', 'lesson_progress',
    'quiz_attempts', 'reflections', 'achievements', 'student_achievements',
    'announcements', 'notification_reads', 'messages', 'message_reads',
    'media_assets', 'infographic_assets'
  );

create temporary table _wasatify_policy_target (
  tablename name not null,
  policyname name not null,
  role_name name not null,
  cmd text not null,
  using_expr text,
  check_expr text
);

do $$
declare
  table_name name;
  role_name name;
  action_name text;
  policy_row record;
  matching_count integer;
  using_expr text;
  check_expr text;
begin
  perform set_config('search_path', 'public, pg_catalog', true);

  if exists (
    select 1 from _wasatify_policy_snapshot
    where permissive <> 'PERMISSIVE'
  ) then
    raise exception 'Restrictive policies require manual consolidation';
  end if;

  for table_name in select distinct tablename from _wasatify_policy_snapshot loop
    foreach role_name in array array['anon'::name, 'authenticated'::name] loop
      foreach action_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        select
          count(*),
          string_agg('(' || coalesce(qual, 'true') || ')', ' OR ' order by policyname),
          string_agg('(' || coalesce(with_check, qual, 'true') || ')', ' OR ' order by policyname)
        into matching_count, using_expr, check_expr
        from _wasatify_policy_snapshot
        where tablename = table_name
          and cmd in ('ALL', action_name)
          and (role_name = any(roles) or 'public'::name = any(roles));

        if matching_count > 0 then
          insert into _wasatify_policy_target
          values (
            table_name,
            (table_name::text || '_' || lower(action_name) || '_' || role_name::text)::name,
            role_name,
            action_name,
            using_expr,
            check_expr
          );
        end if;
      end loop;
    end loop;
  end loop;

  for policy_row in select * from _wasatify_policy_snapshot loop
    execute format(
      'drop policy %I on public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  end loop;

  for policy_row in select * from _wasatify_policy_target loop
    if policy_row.cmd = 'INSERT' then
      execute format(
        'create policy %I on public.%I for insert to %I with check (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.role_name, policy_row.check_expr
      );
    elsif policy_row.cmd = 'UPDATE' then
      execute format(
        'create policy %I on public.%I for update to %I using (%s) with check (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.role_name, policy_row.using_expr, policy_row.check_expr
      );
    else
      execute format(
        'create policy %I on public.%I for %s to %I using (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.cmd, policy_row.role_name, policy_row.using_expr
      );
    end if;
  end loop;
end $$;

drop table pg_temp._wasatify_policy_target;
drop table pg_temp._wasatify_policy_snapshot;

-- Class assignment access is read-only outside the scoped RPC functions.
alter table public.class_assignments enable row level security;
alter table public.assignment_submissions enable row level security;

revoke all on table public.class_assignments, public.assignment_submissions from public, anon, authenticated;
grant select on table public.class_assignments, public.assignment_submissions to authenticated;

create policy class_assignments_select_scoped
on public.class_assignments for select
to authenticated
using (
  app_private.is_admin()
  or (app_private.is_teacher() and teacher_id = (select auth.uid()))
  or (
    app_private.is_student()
    and class_id = (select app_private.current_profile_class_id())
  )
);

create policy assignment_submissions_select_scoped
on public.assignment_submissions for select
to authenticated
using (
  app_private.is_admin()
  or (app_private.is_student() and student_id = (select auth.uid()))
  or (
    app_private.is_teacher()
    and exists (
      select 1
      from public.class_assignments a
      where a.id = assignment_submissions.assignment_id
        and a.teacher_id = (select auth.uid())
    )
  )
);

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

create policy assignment_submission_files_read_scoped
on storage.objects for select
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and exists (
    select 1
    from public.assignment_submissions s
    join public.class_assignments a on a.id = s.assignment_id
    where s.file_path = storage.objects.name
      and (
        s.student_id = (select auth.uid())
        or a.teacher_id = (select auth.uid())
        or (select app_private.is_admin())
      )
  )
);

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
