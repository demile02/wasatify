create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin'::public.app_role, false)
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'teacher'::public.app_role, false)
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'student'::public.app_role, false)
$$;

create or replace function public.teacher_owns_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.teacher_can_read_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.teacher_owns_module(target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.modules m
    where m.id = target_module_id
      and coalesce(m.created_by, m.teacher_id) = auth.uid()
  )
$$;

create or replace function public.teacher_owns_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    left join public.modules m on m.id = q.module_id
    where q.id = target_quiz_id
      and (q.teacher_id = auth.uid() or m.teacher_id = auth.uid())
  )
$$;

create or replace function public.student_can_read_module(target_module_id uuid, target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.lesson_belongs_to_module(target_lesson_id uuid, target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    where l.id = target_lesson_id
      and l.module_id = target_module_id
  )
$$;

create or replace function public.student_can_attempt_quiz(target_quiz_id uuid, target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = target_quiz_id
      and (q.status = 'published'::public.quiz_status or q.is_published = true)
      and public.student_can_read_module(q.module_id, target_student_id)
  )
$$;

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
alter table public.media_assets enable row level security;
alter table public.infographic_assets enable row level security;

create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_select_teacher_students"
on public.profiles for select
to authenticated
using (public.is_teacher() and public.teacher_can_read_student(id));

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('student'::public.app_role, 'teacher'::public.app_role)
);

create policy "profiles_update_own_without_role_escalation"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.current_profile_role()
);

create policy "classes_admin_all"
on public.classes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "classes_select_public_registration"
on public.classes for select
to anon, authenticated
using (true);

grant select on public.classes to anon, authenticated;
grant execute on function public.get_public_classes_for_registration() to anon, authenticated;

create policy "classes_select_related"
on public.classes for select
to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.class_id = classes.id
  )
);

create policy "classes_insert_teacher_own"
on public.classes for insert
to authenticated
with check (public.is_teacher() and teacher_id = auth.uid());

create policy "classes_update_teacher_own"
on public.classes for update
to authenticated
using (public.is_teacher() and teacher_id = auth.uid())
with check (public.is_teacher() and teacher_id = auth.uid());

create policy "classes_delete_teacher_own"
on public.classes for delete
to authenticated
using (public.is_teacher() and teacher_id = auth.uid());

drop policy if exists "modules_admin_all" on public.modules;
drop policy if exists "modules_select_student_published_or_teacher_own" on public.modules;
drop policy if exists "modules_insert_teacher_own" on public.modules;
drop policy if exists "modules_update_teacher_own" on public.modules;
drop policy if exists "modules_delete_teacher_own" on public.modules;

create policy "modules_admin_all"
on public.modules for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "modules_select_student_published_or_teacher_own"
on public.modules for select
to authenticated
using (
  public.teacher_owns_module(id)
  or public.student_can_read_module(id, auth.uid())
);

create policy "modules_insert_teacher_own"
on public.modules for insert
to authenticated
with check (
  public.is_teacher()
  and coalesce(created_by, teacher_id) = auth.uid()
  and (teacher_id is null or teacher_id = auth.uid())
  and (class_id is null or public.teacher_owns_class(class_id))
);

create policy "modules_update_teacher_own"
on public.modules for update
to authenticated
using (public.is_teacher() and public.teacher_owns_module(id))
with check (
  public.is_teacher()
  and coalesce(created_by, teacher_id) = auth.uid()
  and (teacher_id is null or teacher_id = auth.uid())
  and (class_id is null or public.teacher_owns_class(class_id))
);

create policy "modules_delete_teacher_own"
on public.modules for delete
to authenticated
using (public.is_teacher() and public.teacher_owns_module(id));

drop policy if exists "lessons_admin_all" on public.lessons;
drop policy if exists "lessons_select_student_or_teacher" on public.lessons;
drop policy if exists "lessons_insert_teacher_module" on public.lessons;
drop policy if exists "lessons_update_teacher_module" on public.lessons;
drop policy if exists "lessons_delete_teacher_module" on public.lessons;

create policy "lessons_admin_all"
on public.lessons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lessons_select_allowed_module"
on public.lessons for select
to authenticated
using (
  public.teacher_owns_module(module_id)
  or public.student_can_read_module(module_id, auth.uid())
);

create policy "lessons_insert_teacher_module"
on public.lessons for insert
to authenticated
with check (public.is_teacher() and public.teacher_owns_module(module_id));

create policy "lessons_update_teacher_module"
on public.lessons for update
to authenticated
using (public.is_teacher() and public.teacher_owns_module(module_id))
with check (public.is_teacher() and public.teacher_owns_module(module_id));

create policy "lessons_delete_teacher_module"
on public.lessons for delete
to authenticated
using (public.is_teacher() and public.teacher_owns_module(module_id));

drop policy if exists "quizzes_admin_all" on public.quizzes;
drop policy if exists "quizzes_select_student_or_teacher" on public.quizzes;
drop policy if exists "quizzes_insert_teacher_module" on public.quizzes;
drop policy if exists "quizzes_update_teacher_module" on public.quizzes;
drop policy if exists "quizzes_delete_teacher_module" on public.quizzes;

create policy "quizzes_admin_all"
on public.quizzes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "quizzes_select_allowed"
on public.quizzes for select
to authenticated
using (
  public.teacher_owns_quiz(id)
  or ((status = 'published'::public.quiz_status or is_published) and public.student_can_read_module(module_id, auth.uid()))
);

create policy "quizzes_insert_teacher_module"
on public.quizzes for insert
to authenticated
with check (
  public.is_teacher()
  and teacher_id = auth.uid()
  and public.teacher_owns_module(module_id)
);

create policy "quizzes_update_teacher_own"
on public.quizzes for update
to authenticated
using (public.is_teacher() and public.teacher_owns_quiz(id))
with check (
  public.is_teacher()
  and teacher_id = auth.uid()
  and public.teacher_owns_module(module_id)
);

create policy "quizzes_delete_teacher_own"
on public.quizzes for delete
to authenticated
using (public.is_teacher() and public.teacher_owns_quiz(id));

drop policy if exists "quiz_questions_admin_all" on public.quiz_questions;
drop policy if exists "quiz_questions_select_student_or_teacher" on public.quiz_questions;
drop policy if exists "quiz_questions_insert_teacher_quiz" on public.quiz_questions;
drop policy if exists "quiz_questions_update_teacher_quiz" on public.quiz_questions;
drop policy if exists "quiz_questions_delete_teacher_quiz" on public.quiz_questions;

create policy "quiz_questions_admin_all"
on public.quiz_questions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "quiz_questions_select_teacher_only"
on public.quiz_questions for select
to authenticated
using (public.is_teacher() and public.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_select_student_published_quiz"
on public.quiz_questions for select
to authenticated
using (
  public.is_student()
  and public.student_can_attempt_quiz(quiz_id, auth.uid())
);

create policy "quiz_questions_insert_teacher_quiz"
on public.quiz_questions for insert
to authenticated
with check (public.is_teacher() and public.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_update_teacher_quiz"
on public.quiz_questions for update
to authenticated
using (public.is_teacher() and public.teacher_owns_quiz(quiz_id))
with check (public.is_teacher() and public.teacher_owns_quiz(quiz_id));

create policy "quiz_questions_delete_teacher_quiz"
on public.quiz_questions for delete
to authenticated
using (public.is_teacher() and public.teacher_owns_quiz(quiz_id));

create policy "module_progress_admin_all"
on public.module_progress for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "module_progress_select_own_or_teacher_class"
on public.module_progress for select
to authenticated
using (
  student_id = auth.uid()
  or (public.is_teacher() and public.teacher_can_read_student(student_id))
);

create policy "module_progress_insert_own"
on public.module_progress for insert
to authenticated
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "module_progress_update_own"
on public.module_progress for update
to authenticated
using (public.is_student() and student_id = auth.uid())
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "module_progress_delete_own"
on public.module_progress for delete
to authenticated
using (public.is_student() and student_id = auth.uid());

drop policy if exists "module_progress_delete_teacher_class" on public.module_progress;
create policy "module_progress_delete_teacher_class"
on public.module_progress for delete
to authenticated
using (
  public.is_teacher()
  and public.teacher_can_read_student(student_id)
  and public.teacher_owns_module(module_id)
);

create policy "lesson_progress_admin_all"
on public.lesson_progress for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lesson_progress_select_own_or_teacher_class"
on public.lesson_progress for select
to authenticated
using (
  student_id = auth.uid()
  or (public.is_teacher() and public.teacher_can_read_student(student_id))
);

create policy "lesson_progress_insert_own"
on public.lesson_progress for insert
to authenticated
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.lesson_belongs_to_module(lesson_id, module_id)
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "lesson_progress_update_own"
on public.lesson_progress for update
to authenticated
using (public.is_student() and student_id = auth.uid())
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.lesson_belongs_to_module(lesson_id, module_id)
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "lesson_progress_delete_own"
on public.lesson_progress for delete
to authenticated
using (public.is_student() and student_id = auth.uid());

drop policy if exists "lesson_progress_delete_teacher_class" on public.lesson_progress;
create policy "lesson_progress_delete_teacher_class"
on public.lesson_progress for delete
to authenticated
using (
  public.is_teacher()
  and public.teacher_can_read_student(student_id)
  and public.teacher_owns_module(module_id)
);

create policy "quiz_attempts_admin_all"
on public.quiz_attempts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "quiz_attempts_select_own_or_teacher_class"
on public.quiz_attempts for select
to authenticated
using (
  student_id = auth.uid()
  or (public.is_teacher() and public.teacher_can_read_student(student_id))
);

create policy "quiz_attempts_insert_own"
on public.quiz_attempts for insert
to authenticated
with check (
  public.is_student()
  and student_id = auth.uid()
  and status in ('in_progress'::public.quiz_attempt_status, 'submitted'::public.quiz_attempt_status, 'graded'::public.quiz_attempt_status)
  and public.student_can_attempt_quiz(quiz_id, auth.uid())
);

create policy "quiz_attempts_update_own"
on public.quiz_attempts for update
to authenticated
using (public.is_student() and student_id = auth.uid())
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.student_can_attempt_quiz(quiz_id, auth.uid())
);

create policy "quiz_attempts_delete_own"
on public.quiz_attempts for delete
to authenticated
using (public.is_student() and student_id = auth.uid());

drop policy if exists "quiz_attempts_delete_teacher_class" on public.quiz_attempts;
create policy "quiz_attempts_delete_teacher_class"
on public.quiz_attempts for delete
to authenticated
using (
  public.is_teacher()
  and public.teacher_can_read_student(student_id)
  and exists (
    select 1
    from public.quizzes q
    join public.modules m on m.id = q.module_id
    where q.id = quiz_attempts.quiz_id
      and coalesce(m.created_by, m.teacher_id) = auth.uid()
  )
);

create policy "reflections_admin_all"
on public.reflections for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "reflections_select_own_or_teacher_class"
on public.reflections for select
to authenticated
using (
  student_id = auth.uid()
  or (public.is_teacher() and public.teacher_can_read_student(student_id))
);

create policy "reflections_insert_own"
on public.reflections for insert
to authenticated
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "reflections_update_own"
on public.reflections for update
to authenticated
using (public.is_student() and student_id = auth.uid())
with check (
  public.is_student()
  and student_id = auth.uid()
  and public.student_can_read_module(module_id, auth.uid())
);

create policy "reflections_update_teacher_review"
on public.reflections for update
to authenticated
using (public.is_teacher() and public.teacher_can_read_student(student_id))
with check (public.is_teacher() and public.teacher_can_read_student(student_id));

create policy "reflections_delete_own"
on public.reflections for delete
to authenticated
using (public.is_student() and student_id = auth.uid());

drop policy if exists "reflections_delete_teacher_class" on public.reflections;
create policy "reflections_delete_teacher_class"
on public.reflections for delete
to authenticated
using (
  public.is_teacher()
  and public.teacher_can_read_student(student_id)
  and public.teacher_owns_module(module_id)
);

create policy "achievements_admin_all"
on public.achievements for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "achievements_select_authenticated"
on public.achievements for select
to authenticated
using (true);

create policy "student_achievements_admin_all"
on public.student_achievements for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "student_achievements_select_own_or_teacher_class"
on public.student_achievements for select
to authenticated
using (
  student_id = auth.uid()
  or (public.is_teacher() and public.teacher_can_read_student(student_id))
);

create policy "student_achievements_insert_own"
on public.student_achievements for insert
to authenticated
with check (public.is_student() and student_id = auth.uid());

create policy "announcements_admin_all"
on public.announcements for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "announcements_select_related"
on public.announcements for select
to authenticated
using (
  teacher_id = auth.uid()
  or (
    coalesce(status, 'draft') = 'published'
    and published_at is not null
    and published_at <= now()
    and (
      class_id is null
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.class_id = announcements.class_id
      )
    )
  )
);

create policy "announcements_insert_teacher_own"
on public.announcements for insert
to authenticated
with check (
  public.is_teacher()
  and teacher_id = auth.uid()
  and (class_id is null or public.teacher_owns_class(class_id))
);

create policy "announcements_update_teacher_own"
on public.announcements for update
to authenticated
using (public.is_teacher() and teacher_id = auth.uid())
with check (
  public.is_teacher()
  and teacher_id = auth.uid()
  and (class_id is null or public.teacher_owns_class(class_id))
);

create policy "announcements_delete_teacher_own"
on public.announcements for delete
to authenticated
using (public.is_teacher() and teacher_id = auth.uid());

create policy "media_assets_admin_all"
on public.media_assets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "media_assets_select_allowed"
on public.media_assets for select
to authenticated
using (
  owner_id = auth.uid()
  or (module_id is not null and public.teacher_owns_module(module_id))
  or (module_id is not null and public.student_can_read_module(module_id, auth.uid()))
);

create policy "media_assets_insert_teacher_or_owner"
on public.media_assets for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (
    kind = 'avatar'::public.media_kind
    or (public.is_teacher() and (module_id is null or public.teacher_owns_module(module_id)))
  )
);

create policy "media_assets_update_owner_or_teacher_module"
on public.media_assets for update
to authenticated
using (
  owner_id = auth.uid()
  or (public.is_teacher() and module_id is not null and public.teacher_owns_module(module_id))
)
with check (
  owner_id = auth.uid()
  or (public.is_teacher() and module_id is not null and public.teacher_owns_module(module_id))
);

create policy "media_assets_delete_owner_or_teacher_module"
on public.media_assets for delete
to authenticated
using (
  owner_id = auth.uid()
  or (public.is_teacher() and module_id is not null and public.teacher_owns_module(module_id))
);

create policy "infographic_assets_admin_all"
on public.infographic_assets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "infographic_assets_select_allowed"
on public.infographic_assets for select
to authenticated
using (
  created_by = auth.uid()
  or (module_id is not null and public.teacher_owns_module(module_id))
  or (module_id is not null and public.student_can_read_module(module_id, auth.uid()))
  or (lesson_id is not null and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and public.student_can_read_module(l.module_id, auth.uid())
  ))
);

create policy "infographic_assets_insert_teacher_own"
on public.infographic_assets for insert
to authenticated
with check (
  created_by = auth.uid()
  and (public.is_teacher() or public.is_admin())
  and (module_id is null or public.teacher_owns_module(module_id))
);

create policy "infographic_assets_update_teacher_own"
on public.infographic_assets for update
to authenticated
using (
  created_by = auth.uid()
  or (module_id is not null and public.teacher_owns_module(module_id))
)
with check (
  created_by = auth.uid()
  and (module_id is null or public.teacher_owns_module(module_id))
);

create policy "infographic_assets_delete_teacher_own"
on public.infographic_assets for delete
to authenticated
using (
  created_by = auth.uid()
  or (module_id is not null and public.teacher_owns_module(module_id))
);
