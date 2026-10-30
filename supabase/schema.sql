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
  quick_access jsonb,
  xp integer not null default 0 check (xp >= 0),
  streak_count integer not null default 0 check (streak_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists class_name text,
  add column if not exists subject text,
  add column if not exists quick_access jsonb,
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
  class_code text not null unique default ('KLS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists class_id uuid;

alter table public.classes
  add column if not exists academic_year text;

alter table public.classes
  add column if not exists class_code text;

update public.classes
set class_code = coalesce(nullif(class_code, ''), 'KLS-' || upper(substr(replace(coalesce(join_code, gen_random_uuid()::text), '-', ''), 1, 6)))
where class_code is null or class_code = '';

alter table public.classes
  alter column class_code set default ('KLS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)));

alter table public.classes
  alter column class_code set not null;

create unique index if not exists classes_class_code_key on public.classes(class_code);

create table if not exists public.teacher_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  teacher_name text check (teacher_name is null or char_length(btrim(teacher_name)) between 1 and 120),
  created_by uuid references public.profiles(id) on delete set null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create schema if not exists app_private;
revoke all on schema app_private from public, anon;

create unique index if not exists teacher_invite_codes_normalized_code_key
  on public.teacher_invite_codes (upper(trim(code)));

create or replace function app_private.lock_valid_teacher_invite_code(input_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(trim(coalesce(input_code, '')));
  invite public.teacher_invite_codes%rowtype;
begin
  if normalized_code = '' then
    return null;
  end if;

  select tic.*
  into invite
  from public.teacher_invite_codes tic
  where upper(trim(tic.code)) = normalized_code
  for update;

  if not found
    or not invite.is_active
    or invite.used_at is not null
    or (invite.expires_at is not null and invite.expires_at <= pg_catalog.clock_timestamp())
  then
    return null;
  end if;

  return invite.id;
end;
$$;

revoke all on function app_private.lock_valid_teacher_invite_code(text) from public, anon, authenticated;

create or replace function public.validate_teacher_invite_code(input_code text)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teacher_invite_codes tic
    where upper(trim(tic.code)) = upper(trim(input_code))
      and tic.is_active = true
      and tic.used_at is null
      and (tic.expires_at is null or tic.expires_at > pg_catalog.clock_timestamp())
  )
$$;

create or replace function public.validate_class_code(input_class_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    where upper(trim(c.class_code)) = upper(trim(input_class_code))
  )
$$;

alter table public.profiles
  add column if not exists last_active_at timestamptz;

drop function if exists public.get_public_classes_for_registration();

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
  hero_image_path text,
  image_crop_config jsonb,
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
  add column if not exists hero_image_path text,
  add column if not exists image_crop_config jsonb,
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

create table if not exists public.infographic_assets (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  lesson_id uuid,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  title text not null,
  source_file_url text not null,
  source_file_type text not null,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  slide_count integer not null default 0 check (slide_count >= 0),
  slide_images jsonb not null default '[]'::jsonb,
  error_message text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  infographic_asset_id uuid references public.infographic_assets(id) on delete set null,
  title text not null,
  slug text not null,
  type public.lesson_type not null default 'article',
  content text,
  key_points jsonb check (key_points is null or jsonb_typeof(key_points) = 'array'),
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
  add column if not exists key_points jsonb;

alter table public.lessons
  add column if not exists infographic_asset_id uuid references public.infographic_assets(id) on delete set null;

alter table public.lessons
  add column if not exists reflection_prompt text;

alter table public.infographic_assets
  drop constraint if exists infographic_assets_lesson_id_fkey,
  add constraint infographic_assets_lesson_id_fkey foreign key (lesson_id) references public.lessons(id) on delete cascade;

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

create table if not exists app_private.quiz_attempt_drafts (
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  started_at timestamptz not null,
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 32768),
  updated_at timestamptz not null default now(),
  primary key (student_id, quiz_id)
);

alter table app_private.quiz_attempt_drafts enable row level security;
revoke all on table app_private.quiz_attempt_drafts from public, anon, authenticated;
create index if not exists quiz_attempt_drafts_quiz_id_idx on app_private.quiz_attempt_drafts(quiz_id);
create index if not exists quiz_attempt_drafts_module_id_idx on app_private.quiz_attempt_drafts(module_id);

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

create table if not exists public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete cascade,
  target_class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
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

drop trigger if exists set_infographic_assets_updated_at on public.infographic_assets;
create trigger set_infographic_assets_updated_at
before update on public.infographic_assets
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
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.app_role;
  selected_class_id uuid;
  requested_class_code text;
  requested_teacher_code text;
  teacher_invite_id uuid;
begin
  requested_role := new.raw_user_meta_data->>'role';
  safe_role := case
    when requested_role in ('student', 'teacher') then requested_role::public.app_role
    else 'student'::public.app_role
  end;

  if safe_role = 'teacher' then
    requested_teacher_code := trim(coalesce(new.raw_user_meta_data->>'teacher_invite_code', ''));
    teacher_invite_id := app_private.lock_valid_teacher_invite_code(requested_teacher_code);

    if teacher_invite_id is null then
      raise exception 'Kode guru tidak valid atau sudah digunakan.';
    end if;
  end if;

  if safe_role = 'student' then
    requested_class_code := upper(trim(coalesce(new.raw_user_meta_data->>'class_code', '')));

    if requested_class_code <> '' then
      select c.id
      into selected_class_id
      from public.classes c
      where upper(trim(c.class_code)) = requested_class_code
      limit 1;
    end if;

    if selected_class_id is null and not (
      requested_class_code = ''
      and new.raw_app_meta_data->>'provider' = 'google'
    ) then
      raise exception 'Kode kelas tidak valid.';
    end if;
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
    update public.teacher_invite_codes
    set used_by = new.id,
        used_at = now()
    where id = teacher_invite_id;

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.complete_google_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_class_code text;
  requested_teacher_code text;
  selected_class_id uuid;
  teacher_invite_id uuid;
  profile_role public.app_role;
  current_class_id uuid;
begin
  requested_class_code := upper(trim(coalesce(new.raw_user_meta_data->>'class_code', '')));
  requested_teacher_code := upper(trim(coalesce(new.raw_user_meta_data->>'teacher_invite_code', '')));
  if requested_class_code = '' and requested_teacher_code = '' then
    return new;
  end if;

  select p.role, p.class_id
  into profile_role, current_class_id
  from public.profiles p
  where p.id = new.id
  for update;

  if not found
    or profile_role <> 'student'::public.app_role
    or current_class_id is not null
    or new.raw_app_meta_data->>'provider' <> 'google'
  then
    return new;
  end if;

  if requested_teacher_code <> '' then
    teacher_invite_id := app_private.lock_valid_teacher_invite_code(requested_teacher_code);

    if teacher_invite_id is null then
      raise exception 'Kode guru tidak valid atau sudah digunakan.';
    end if;

    update public.profiles p
    set role = 'teacher'::public.app_role,
        full_name = coalesce(
          nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
          nullif(trim(new.raw_user_meta_data->>'name'), ''),
          p.full_name
        ),
        email = new.email,
        avatar_url = coalesce(nullif(new.raw_user_meta_data->>'avatar_url', ''), p.avatar_url),
        subject = coalesce(nullif(trim(new.raw_user_meta_data->>'subject'), ''), p.subject),
        updated_at = now()
    where p.id = new.id
      and p.role = 'student'::public.app_role
      and p.class_id is null;

    if not found then
      raise exception 'Pendaftaran guru tidak dapat diselesaikan.';
    end if;

    update public.teacher_invite_codes
    set used_by = new.id,
        used_at = now()
    where id = teacher_invite_id;

    insert into public.classes (teacher_id, name, description, grade_level, academic_year)
    values (
      new.id,
      'Kelas Default',
      'Kelas awal yang dibuat otomatis saat akun guru terhubung.',
      null,
      extract(year from now())::text
    )
    on conflict do nothing;

    return new;
  end if;

  select c.id
  into selected_class_id
  from public.classes c
  where upper(trim(c.class_code)) = requested_class_code
  limit 1;

  if selected_class_id is null then
    raise exception 'Kode kelas tidak valid.';
  end if;

  update public.profiles p
  set full_name = coalesce(
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        nullif(trim(new.raw_user_meta_data->>'name'), ''),
        p.full_name
      ),
      email = new.email,
      avatar_url = coalesce(nullif(new.raw_user_meta_data->>'avatar_url', ''), p.avatar_url),
      class_id = selected_class_id,
      updated_at = now()
  where p.id = new.id
    and p.role = 'student'::public.app_role
    and p.class_id is null;

  return new;
end;
$$;

revoke execute on function public.complete_google_registration() from public, anon, authenticated;

drop trigger if exists on_auth_user_student_registration_updated on auth.users;
drop function if exists public.complete_google_student_registration();
drop trigger if exists on_auth_user_registration_metadata_updated on auth.users;
create trigger on_auth_user_registration_metadata_updated
after update of raw_user_meta_data on auth.users
for each row
when (
  new.raw_user_meta_data->>'class_code' is distinct from old.raw_user_meta_data->>'class_code'
  or new.raw_user_meta_data->>'teacher_invite_code' is distinct from old.raw_user_meta_data->>'teacher_invite_code'
)
execute function public.complete_google_registration();

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_class_id_idx on public.profiles(class_id);

create index if not exists classes_teacher_id_idx on public.classes(teacher_id);

create index if not exists modules_teacher_id_idx on public.modules(teacher_id);
create index if not exists modules_created_by_idx on public.modules(created_by);
create index if not exists modules_class_id_idx on public.modules(class_id);
create index if not exists modules_status_idx on public.modules(status);

create index if not exists media_assets_owner_id_idx on public.media_assets(owner_id);
create index if not exists media_assets_module_id_idx on public.media_assets(module_id);

create index if not exists infographic_assets_module_id_idx on public.infographic_assets(module_id);
create index if not exists infographic_assets_lesson_id_idx on public.infographic_assets(lesson_id);
create index if not exists infographic_assets_created_by_idx on public.infographic_assets(created_by);
create index if not exists infographic_assets_media_asset_id_idx on public.infographic_assets(media_asset_id);

create index if not exists lessons_module_id_idx on public.lessons(module_id);
create index if not exists lessons_infographic_asset_id_idx on public.lessons(infographic_asset_id);
create index if not exists lessons_media_asset_id_idx on public.lessons(media_asset_id);

create index if not exists quizzes_module_id_idx on public.quizzes(module_id);
create index if not exists quizzes_teacher_id_idx on public.quizzes(teacher_id);
create index if not exists quizzes_status_idx on public.quizzes(status);

create index if not exists module_progress_module_id_idx on public.module_progress(module_id);

create index if not exists lesson_progress_student_id_idx on public.lesson_progress(student_id);
create index if not exists lesson_progress_module_id_idx on public.lesson_progress(module_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);

create index if not exists quiz_attempts_student_id_idx on public.quiz_attempts(student_id);
create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);

create index if not exists reflections_module_id_idx on public.reflections(module_id);
create index if not exists reflections_reviewed_by_idx on public.reflections(reviewed_by);

create index if not exists student_achievements_achievement_id_idx on public.student_achievements(achievement_id);

create index if not exists announcements_teacher_id_idx on public.announcements(teacher_id);
create index if not exists announcements_class_id_idx on public.announcements(class_id);

create index if not exists notification_reads_user_id_idx on public.notification_reads(user_id);
create index if not exists notification_reads_notification_key_idx on public.notification_reads(notification_key);

create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_recipient_id_idx on public.messages(recipient_id);
create index if not exists messages_target_class_id_idx on public.messages(target_class_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

create index if not exists message_reads_user_id_idx on public.message_reads(user_id);

create index if not exists teacher_invite_codes_created_by_idx on public.teacher_invite_codes(created_by);
create index if not exists teacher_invite_codes_used_by_idx on public.teacher_invite_codes(used_by);

-- Class assignments and student submissions.
create table public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 5 and 120),
  instructions text not null check (char_length(btrim(instructions)) between 20 and 5000),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index class_assignments_teacher_created_idx
  on public.class_assignments (teacher_id, created_at desc, id desc);
create index class_assignments_class_created_idx
  on public.class_assignments (class_id, created_at desc, id desc);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.class_assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer text check (answer is null or char_length(btrim(answer)) between 20 and 5000),
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  score integer check (score between 0 and 100),
  feedback text check (feedback is null or char_length(feedback) <= 2000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  unique (assignment_id, student_id),
  check (
    (answer is not null and char_length(btrim(answer)) between 20 and 5000)
    or file_path is not null
  ),
  check (
    (file_path is null and file_name is null and file_size is null and file_type is null)
    or (
      file_path is not null
      and file_name is not null and char_length(btrim(file_name)) between 1 and 255
      and file_size is not null and file_size between 1 and 10485760
      and file_type is not null and file_type in (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'image/jpeg', 'image/png', 'image/webp'
      )
    )
  ),
  check (
    (status = 'submitted' and score is null and reviewed_at is null and reviewed_by is null)
    or (status = 'reviewed' and score is not null and reviewed_at is not null and reviewed_by is not null)
  )
);

create index assignment_submissions_student_submitted_idx
  on public.assignment_submissions (student_id, submitted_at desc, id desc);
create index assignment_submissions_reviewed_by_idx
  on public.assignment_submissions (reviewed_by)
  where reviewed_by is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-submissions', 'assignment-submissions', false, 10485760,
  array[
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'image/jpeg', 'image/png', 'image/webp'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


create or replace function public.create_class_assignment(
  assignment_class_id uuid,
  assignment_title text,
  assignment_instructions text,
  assignment_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  class_teacher_id uuid;
  assignment_id uuid;
begin
  if caller_id is null then raise exception 'Sesi guru tidak ditemukan.'; end if;
  select p.role into caller_role from public.profiles p where p.id = caller_id;
  if caller_role is distinct from 'teacher'::public.app_role
    and caller_role is distinct from 'admin'::public.app_role then
    raise exception 'Hanya guru yang dapat membuat tugas.';
  end if;
  if char_length(btrim(coalesce(assignment_title, ''))) not between 5 and 120
    or char_length(btrim(coalesce(assignment_instructions, ''))) not between 20 and 5000 then
    raise exception 'Judul atau instruksi tugas tidak valid.';
  end if;
  if assignment_due_at is not null and assignment_due_at <= now() then
    raise exception 'Batas waktu tugas harus berada di masa mendatang.';
  end if;

  select c.teacher_id into class_teacher_id
  from public.classes c
  where c.id = assignment_class_id
    and (caller_role = 'admin'::public.app_role or c.teacher_id = caller_id);
  if class_teacher_id is null then raise exception 'Kelas tujuan tidak tersedia untuk akun ini.'; end if;

  insert into public.class_assignments (class_id, teacher_id, title, instructions, due_at)
  values (assignment_class_id, class_teacher_id, btrim(assignment_title), btrim(assignment_instructions), assignment_due_at)
  returning id into assignment_id;
  return assignment_id;
end;
$$;

create or replace function public.submit_class_assignment(
  target_assignment_id uuid,
  answer_text text,
  file_path_input text default null,
  file_name_input text default null,
  file_size_input bigint default null,
  file_type_input text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_class_id uuid;
  caller_role public.app_role;
  task_due_at timestamptz;
  existing_id uuid;
  existing_status text;
  submission_id uuid;
  normalized_answer text := nullif(btrim(coalesce(answer_text, '')), '');
  normalized_file_name text := nullif(btrim(coalesce(file_name_input, '')), '');
begin
  if caller_id is null then raise exception 'Sesi siswa tidak ditemukan.'; end if;
  select p.role, p.class_id into caller_role, caller_class_id
  from public.profiles p where p.id = caller_id for update;
  if caller_role is distinct from 'student'::public.app_role then raise exception 'Hanya siswa yang dapat mengirim jawaban.'; end if;
  if normalized_answer is not null and char_length(normalized_answer) not between 20 and 5000 then
    raise exception 'Jawaban teks harus berisi 20 sampai 5.000 karakter.';
  end if;
  if normalized_answer is null and file_path_input is null then
    raise exception 'Tulis jawaban atau lampirkan berkas terlebih dahulu.';
  end if;
  if file_path_input is not null then
    if normalized_file_name is null
      or char_length(normalized_file_name) > 255
      or file_size_input is null
      or file_size_input not between 1 and 10485760
      or file_type_input is null
      or file_type_input not in (
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'image/jpeg', 'image/png', 'image/webp'
      )
      or file_path_input !~ ('^' || caller_id::text || '/' || target_assignment_id::text || '/[0-9a-fA-F-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|webp)$') then
      raise exception 'Lampiran tugas tidak valid.';
    end if;
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'assignment-submissions'
        and o.name = file_path_input
    ) then
      raise exception 'Berkas lampiran belum berhasil diunggah.';
    end if;
  elsif file_name_input is not null or file_size_input is not null or file_type_input is not null then
    raise exception 'Metadata lampiran tidak lengkap.';
  end if;

  select a.due_at into task_due_at
  from public.class_assignments a
  where a.id = target_assignment_id and a.class_id = caller_class_id;
  if not found then raise exception 'Tugas tidak ditemukan untuk kelasmu.'; end if;
  if task_due_at is not null and task_due_at < now() then raise exception 'Batas waktu pengumpulan tugas sudah lewat.'; end if;

  select s.id, s.status into existing_id, existing_status
  from public.assignment_submissions s
  where s.assignment_id = target_assignment_id and s.student_id = caller_id
  for update;
  if existing_status = 'reviewed' then raise exception 'Jawaban sudah dinilai dan tidak dapat diubah.'; end if;

  if existing_id is null then
    insert into public.assignment_submissions (
      assignment_id, student_id, answer, file_path, file_name, file_size, file_type
    ) values (
      target_assignment_id, caller_id, normalized_answer, file_path_input,
      normalized_file_name, file_size_input, file_type_input
    )
    returning id into submission_id;
  else
    update public.assignment_submissions
    set answer = normalized_answer,
        file_path = file_path_input,
        file_name = normalized_file_name,
        file_size = file_size_input,
        file_type = file_type_input,
        submitted_at = now()
    where id = existing_id
    returning id into submission_id;
  end if;
  return submission_id;
end;
$$;

revoke all on function public.submit_class_assignment(uuid, text, text, text, bigint, text) from public, anon;
grant execute on function public.submit_class_assignment(uuid, text, text, text, bigint, text) to authenticated;

create or replace function public.review_class_assignment(
  target_submission_id uuid,
  score_input integer,
  feedback_input text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  task_teacher_id uuid;
  current_status text;
begin
  if caller_id is null then raise exception 'Sesi guru tidak ditemukan.'; end if;
  select p.role into caller_role from public.profiles p where p.id = caller_id;
  if caller_role is distinct from 'teacher'::public.app_role
    and caller_role is distinct from 'admin'::public.app_role then
    raise exception 'Hanya guru yang dapat menilai tugas.';
  end if;
  if score_input not between 0 and 100 or char_length(coalesce(feedback_input, '')) > 2000 then
    raise exception 'Nilai atau catatan penilaian tidak valid.';
  end if;

  select a.teacher_id, s.status into task_teacher_id, current_status
  from public.assignment_submissions s
  join public.class_assignments a on a.id = s.assignment_id
  where s.id = target_submission_id
  for update of s;
  if not found then raise exception 'Jawaban tugas tidak ditemukan.'; end if;
  if caller_role = 'teacher'::public.app_role and task_teacher_id <> caller_id then
    raise exception 'Jawaban tugas ini bukan milik kelasmu.';
  end if;
  if current_status = 'reviewed' then raise exception 'Jawaban sudah dinilai.'; end if;

  update public.assignment_submissions
  set status = 'reviewed', score = score_input, feedback = nullif(btrim(coalesce(feedback_input, '')), ''),
      reviewed_at = now(), reviewed_by = caller_id
  where id = target_submission_id;
end;
$$;
