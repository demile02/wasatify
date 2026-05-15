create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.module_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.lesson_type as enum ('article', 'video', 'infographic', 'reflection');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.question_type as enum ('single_choice', 'multiple_choice', 'true_false');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.learning_status as enum ('completed', 'in_progress', 'not_started', 'locked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_attempt_status as enum ('in_progress', 'submitted', 'graded');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_kind as enum ('avatar', 'module_cover', 'lesson_attachment', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  full_name text not null,
  email text unique,
  avatar_url text,
  school_name text,
  class_name text,
  subject text,
  bio text,
  xp integer not null default 0 check (xp >= 0),
  streak_count integer not null default 0 check (streak_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists class_name text,
  add column if not exists subject text,
  add column if not exists xp integer not null default 0 check (xp >= 0),
  add column if not exists streak_count integer not null default 0 check (streak_count >= 0);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  grade_level text,
  academic_year text,
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists class_id uuid;

alter table public.classes
  add column if not exists academic_year text;

alter table public.profiles
  add column if not exists last_active_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_class_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_class_id_fkey
      foreign key (class_id) references public.classes(id) on delete set null;
  end if;
end $$;

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text not null,
  cover_image_path text,
  difficulty text check (difficulty is null or difficulty in ('pemula', 'menengah', 'lanjut')),
  tags text[] not null default '{}'::text[],
  status public.module_status not null default 'draft',
  is_public boolean not null default true,
  estimated_minutes integer not null default 15 check (estimated_minutes > 0),
  order_index integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists difficulty text check (difficulty is null or difficulty in ('pemula', 'menengah', 'lanjut'));

update public.modules
set created_by = teacher_id
where created_by is null
  and teacher_id is not null;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  module_id uuid references public.modules(id) on delete cascade,
  title text,
  bucket text not null,
  path text not null,
  public_url text,
  file_type text check (file_type is null or file_type in ('image', 'video', 'pdf', 'document', 'other')),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  kind public.media_kind not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

alter table public.media_assets
  add column if not exists title text,
  add column if not exists file_type text check (file_type is null or file_type in ('image', 'video', 'pdf', 'document', 'other')),
  add column if not exists size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  add column if not exists module_id uuid references public.modules(id) on delete set null;

alter table public.media_assets
  drop constraint if exists media_assets_module_id_fkey,
  add constraint media_assets_module_id_fkey foreign key (module_id) references public.modules(id) on delete set null;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  title text not null,
  slug text not null,
  type public.lesson_type not null default 'article',
  content text,
  reflection_prompt text,
  video_url text,
  infographic_url text,
  order_index integer not null default 1,
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

alter table public.lessons
  add column if not exists infographic_url text;

alter table public.lessons
  add column if not exists reflection_prompt text;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status public.quiz_status not null default 'draft',
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  max_attempts integer not null default 3 check (max_attempts > 0),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  is_published boolean not null default false,
  allow_retake boolean not null default true,
  show_explanation boolean not null default true,
  shuffle_questions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, title)
);

alter table public.quizzes
  add column if not exists status public.quiz_status not null default 'draft';

alter table public.quizzes
  add column if not exists allow_retake boolean not null default true,
  add column if not exists show_explanation boolean not null default true,
  add column if not exists shuffle_questions boolean not null default false;

update public.quizzes
set status = case
  when is_published then 'published'::public.quiz_status
  else status
end;

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type public.question_type not null default 'single_choice',
  question_text text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  correct_answer jsonb not null check (jsonb_typeof(correct_answer) = 'object'),
  explanation text,
  show_explanation boolean not null default true,
  points integer not null default 10 check (points > 0),
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, order_index)
);

alter table public.quiz_questions
  add column if not exists show_explanation boolean not null default true;

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  status public.learning_status not null default 'not_started',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, module_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.quiz_attempt_status not null default 'in_progress',
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  total_points integer check (total_points is null or total_points >= 0),
  earned_points integer check (earned_points is null or earned_points >= 0),
  passed boolean not null default false,
  total_questions integer check (total_questions is null or total_questions >= 0),
  correct_answers integer check (correct_answers is null or correct_answers >= 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_attempts
  add column if not exists total_points integer check (total_points is null or total_points >= 0),
  add column if not exists earned_points integer check (earned_points is null or earned_points >= 0),
  add column if not exists passed boolean not null default false;

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  reflection_text text not null,
  action_plan text,
  teacher_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, module_id)
);

alter table public.reflections
  add column if not exists teacher_note text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text,
  criteria jsonb not null default '{}'::jsonb check (jsonb_typeof(criteria) = 'object'),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (student_id, achievement_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements
  add column if not exists status text not null default 'draft' check (status in ('draft', 'published'));

update public.announcements
set status = case when published_at is null then 'draft' else 'published' end
where status = 'draft' and published_at is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists set_modules_updated_at on public.modules;
create trigger set_modules_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists set_quizzes_updated_at on public.quizzes;
create trigger set_quizzes_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_questions_updated_at on public.quiz_questions;
create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

drop trigger if exists set_module_progress_updated_at on public.module_progress;
create trigger set_module_progress_updated_at
before update on public.module_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_attempts_updated_at on public.quiz_attempts;
create trigger set_quiz_attempts_updated_at
before update on public.quiz_attempts
for each row execute function public.set_updated_at();

drop trigger if exists set_reflections_updated_at on public.reflections;
create trigger set_reflections_updated_at
before update on public.reflections
for each row execute function public.set_updated_at();

drop trigger if exists set_achievements_updated_at on public.achievements;
create trigger set_achievements_updated_at
before update on public.achievements
for each row execute function public.set_updated_at();

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  safe_role public.app_role;
  selected_class_id uuid;
begin
  requested_role := new.raw_user_meta_data->>'role';
  safe_role := case
    when requested_role in ('student', 'teacher', 'admin') then requested_role::public.app_role
    else 'student'::public.app_role
  end;

  if (new.raw_user_meta_data->>'class_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    selected_class_id := (new.raw_user_meta_data->>'class_id')::uuid;
  end if;

  insert into public.profiles (id, role, full_name, email, avatar_url, school_name, class_id, class_name, subject)
  values (
    new.id,
    safe_role,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pengguna WASATIFY'
    ),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'school_name',
    selected_class_id,
    nullif(new.raw_user_meta_data->>'class_name', ''),
    nullif(new.raw_user_meta_data->>'subject', '')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        school_name = coalesce(excluded.school_name, public.profiles.school_name),
        class_id = coalesce(excluded.class_id, public.profiles.class_id),
        class_name = coalesce(excluded.class_name, public.profiles.class_name),
        subject = coalesce(excluded.subject, public.profiles.subject),
        updated_at = now();

  if safe_role = 'teacher' then
    insert into public.classes (teacher_id, name, description, grade_level, academic_year)
    values (
      new.id,
      'Kelas Default',
      'Kelas awal yang dibuat otomatis saat akun guru dikonfirmasi.',
      null,
      extract(year from now())::text
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_class_id_idx on public.profiles(class_id);

create index if not exists classes_teacher_id_idx on public.classes(teacher_id);

create index if not exists modules_teacher_id_idx on public.modules(teacher_id);
create index if not exists modules_created_by_idx on public.modules(created_by);
create index if not exists modules_class_id_idx on public.modules(class_id);
create index if not exists modules_status_idx on public.modules(status);
create index if not exists modules_slug_idx on public.modules(slug);

create index if not exists media_assets_owner_id_idx on public.media_assets(owner_id);
create index if not exists media_assets_module_id_idx on public.media_assets(module_id);

create index if not exists lessons_module_id_idx on public.lessons(module_id);

create index if not exists quizzes_module_id_idx on public.quizzes(module_id);
create index if not exists quizzes_teacher_id_idx on public.quizzes(teacher_id);
create index if not exists quizzes_status_idx on public.quizzes(status);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

create index if not exists module_progress_student_id_idx on public.module_progress(student_id);
create index if not exists module_progress_module_id_idx on public.module_progress(module_id);

create index if not exists lesson_progress_student_id_idx on public.lesson_progress(student_id);
create index if not exists lesson_progress_module_id_idx on public.lesson_progress(module_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);

create index if not exists quiz_attempts_student_id_idx on public.quiz_attempts(student_id);
create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);

create index if not exists reflections_student_id_idx on public.reflections(student_id);
create index if not exists reflections_module_id_idx on public.reflections(module_id);

create index if not exists student_achievements_student_id_idx on public.student_achievements(student_id);
create index if not exists student_achievements_achievement_id_idx on public.student_achievements(achievement_id);

create index if not exists announcements_teacher_id_idx on public.announcements(teacher_id);
create index if not exists announcements_class_id_idx on public.announcements(class_id);
