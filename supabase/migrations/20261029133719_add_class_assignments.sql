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
  answer text not null check (char_length(btrim(answer)) between 20 and 5000),
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  score integer check (score between 0 and 100),
  feedback text check (feedback is null or char_length(feedback) <= 2000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  unique (assignment_id, student_id),
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
  answer_text text
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
begin
  if caller_id is null then raise exception 'Sesi siswa tidak ditemukan.'; end if;
  select p.role, p.class_id into caller_role, caller_class_id
  from public.profiles p where p.id = caller_id for update;
  if caller_role is distinct from 'student'::public.app_role then raise exception 'Hanya siswa yang dapat mengirim jawaban.'; end if;
  if char_length(btrim(coalesce(answer_text, ''))) not between 20 and 5000 then
    raise exception 'Jawaban harus berisi 20 sampai 5.000 karakter.';
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
    insert into public.assignment_submissions (assignment_id, student_id, answer)
    values (target_assignment_id, caller_id, btrim(answer_text))
    returning id into submission_id;
  else
    update public.assignment_submissions
    set answer = btrim(answer_text), submitted_at = now()
    where id = existing_id
    returning id into submission_id;
  end if;
  return submission_id;
end;
$$;

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

revoke all on function public.create_class_assignment(uuid, text, text, timestamptz) from public, anon;
revoke all on function public.submit_class_assignment(uuid, text) from public, anon;
revoke all on function public.review_class_assignment(uuid, integer, text) from public, anon;
grant execute on function public.create_class_assignment(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.submit_class_assignment(uuid, text) to authenticated;
grant execute on function public.review_class_assignment(uuid, integer, text) to authenticated;
