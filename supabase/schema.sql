create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'teacher')),
  school text,
  class_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  thumbnail text,
  duration text not null,
  order_number integer not null default 1,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.module_contents (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  content_type text not null check (content_type in ('text', 'video', 'infographic', 'reflection')),
  title text not null,
  body text,
  media_url text,
  order_number integer not null default 1
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  explanation text
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  completed boolean not null default false,
  quiz_score integer default 0 check (quiz_score between 0 and 100),
  completed_at timestamptz,
  unique (user_id, module_id)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  reflection_text text not null,
  action_plan text,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role, class_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'class_name'
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        class_name = excluded.class_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.modules enable row level security;
alter table public.module_contents enable row level security;
alter table public.quizzes enable row level security;
alter table public.user_progress enable row level security;
alter table public.reflections enable row level security;
alter table public.announcements enable row level security;

create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "Teachers can read student profiles"
on public.users for select
to authenticated
using (exists (select 1 from public.users teacher where teacher.id = auth.uid() and teacher.role = 'teacher'));

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.users for insert
with check (auth.uid() = id);

create policy "Authenticated users can read learning content"
on public.modules for select
to authenticated
using (true);

create policy "Teachers can manage modules"
on public.modules for all
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'))
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

create policy "Authenticated users can read module content"
on public.module_contents for select
to authenticated
using (true);

create policy "Teachers can manage module content"
on public.module_contents for all
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'))
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

create policy "Authenticated users can read quizzes"
on public.quizzes for select
to authenticated
using (true);

create policy "Teachers can manage quizzes"
on public.quizzes for all
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'))
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

create policy "Students manage own progress"
on public.user_progress for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Teachers read all progress"
on public.user_progress for select
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

create policy "Students manage own reflections"
on public.reflections for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Teachers read reflections"
on public.reflections for select
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

create policy "Authenticated users can read announcements"
on public.announcements for select
to authenticated
using (true);

create policy "Teachers can manage announcements"
on public.announcements for all
to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'))
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role = 'teacher'));

insert into public.modules (title, description, duration, order_number)
values
  ('Apa Itu Islam Wasathiyah?', 'Memahami makna wasathiyah sebagai jalan tengah yang adil dan berimbang.', '12 menit', 1),
  ('Prinsip Moderasi Beragama', 'Mengenal tawazun, tasamuh, i’tidal, dan syura dalam kehidupan sehari-hari.', '20 menit', 2),
  ('Bahaya Ekstremisme Digital', 'Belajar memilah informasi keagamaan di media sosial secara kritis.', '15 menit', 3),
  ('Islam dan Toleransi', 'Membangun adab berbeda pendapat dan hidup damai di masyarakat majemuk.', '18 menit', 4),
  ('Refleksi Nilai', 'Menulis pemahaman diri dan rencana aksi sebagai pribadi moderat.', '10 menit', 5),
  ('Quiz Pemahaman', 'Uji pemahaman nilai-nilai Islam Wasathiyah secara interaktif.', '8 menit', 6)
on conflict do nothing;

with target_module as (
  select id from public.modules where title = 'Quiz Pemahaman' order by order_number limit 1
)
insert into public.quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
select
  target_module.id,
  quiz.question,
  quiz.option_a,
  quiz.option_b,
  quiz.option_c,
  quiz.option_d,
  quiz.correct_answer,
  quiz.explanation
from target_module,
(values
  (
    'Manakah yang termasuk contoh sikap tasamuh dalam kehidupan sehari-hari?',
    'Memaksakan pendapat kepada orang lain',
    'Menghargai perbedaan pendapat dan keyakinan',
    'Menganggap diri paling benar',
    'Menghindari diskusi dengan orang berbeda pendapat',
    'b',
    'Tasamuh berarti toleran, lapang dada, dan menghargai perbedaan dengan tetap memegang prinsip kebaikan.'
  ),
  (
    'Apa makna tawazun dalam prinsip moderasi beragama?',
    'Keseimbangan antara ilmu, amal, dunia, dan akhirat',
    'Mengikuti semua informasi tanpa memeriksa sumber',
    'Menolak semua perbedaan',
    'Mengutamakan emosi saat berdakwah',
    'a',
    'Tawazun menuntun seseorang bersikap seimbang dan tidak berlebihan.'
  )
) as quiz(question, option_a, option_b, option_c, option_d, correct_answer, explanation)
where not exists (
  select 1 from public.quizzes where public.quizzes.question = quiz.question
);
