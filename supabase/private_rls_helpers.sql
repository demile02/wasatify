create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

alter function public.current_profile_role() set schema app_private;
alter function public.is_admin() set schema app_private;
alter function public.is_teacher() set schema app_private;
alter function public.is_student() set schema app_private;
alter function public.teacher_owns_class(uuid) set schema app_private;
alter function public.teacher_can_read_student(uuid) set schema app_private;
alter function public.teacher_owns_module(uuid) set schema app_private;
alter function public.teacher_owns_quiz(uuid) set schema app_private;
alter function public.student_can_read_module(uuid, uuid) set schema app_private;
alter function public.lesson_belongs_to_module(uuid, uuid) set schema app_private;
alter function public.student_can_attempt_quiz(uuid, uuid) set schema app_private;

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
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.modules m
    join public.profiles student on student.id = target_student_id
    where m.id = target_module_id
      and m.status = 'published'::public.module_status
      and student.role = 'student'::public.app_role
      and (
        m.is_public = true
        or m.class_id is null
        or m.class_id = student.class_id
      )
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
