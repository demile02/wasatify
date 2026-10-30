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

create or replace function public.save_learning_quiz_draft(
  module_id_input uuid,
  quiz_id_input uuid,
  answers_input jsonb,
  started_at_input timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  student uuid;
  quiz public.quizzes%rowtype;
  question_count integer;
  attempt_count integer;
  safe_started_at timestamptz;
  saved_at timestamptz;
begin
  student := app_private.lock_student_module(module_id_input);

  select * into quiz
  from public.quizzes q
  where q.id = quiz_id_input and q.module_id = module_id_input and q.is_published
  for share;
  if not found then raise exception 'Kuis tidak ditemukan atau belum dipublikasikan.'; end if;

  if exists (
    select 1 from public.lessons l
    where l.module_id = module_id_input
      and not exists (
        select 1 from public.lesson_progress lp
        where lp.lesson_id = l.id and lp.student_id = student and lp.completed_at is not null
      )
  ) then
    raise exception 'Selesaikan semua materi modul sebelum mengerjakan kuis.';
  end if;

  if jsonb_typeof(answers_input) is distinct from 'object'
    or octet_length(answers_input::text) > 32768 then
    raise exception 'Data jawaban kuis tidak valid.';
  end if;
  if started_at_input is null or not isfinite(started_at_input) then
    raise exception 'Waktu mulai kuis tidak valid.';
  end if;
  if started_at_input > now() + interval '5 minutes' then
    raise exception 'Waktu perangkat terlalu maju. Periksa tanggal dan jam perangkat.';
  end if;
  safe_started_at := least(started_at_input, now());

  select count(*) into question_count
  from public.quiz_questions q where q.quiz_id = quiz_id_input;
  if question_count = 0 or question_count > 100 then
    raise exception 'Kuis harus memiliki 1 sampai 100 pertanyaan.';
  end if;

  if exists (
    select 1
    from jsonb_each(answers_input) saved_answer
    left join public.quiz_questions q
      on q.quiz_id = quiz_id_input and q.id::text = saved_answer.key
    where q.id is null
      or jsonb_typeof(saved_answer.value) is distinct from 'string'
      or length(saved_answer.value #>> '{}') not between 1 and 500
      or (q.question_type <> 'multiple_choice' and position('|' in (saved_answer.value #>> '{}')) > 0)
      or exists (
        select 1
        from unnest(string_to_array(saved_answer.value #>> '{}', '|')) as selected(choice_id)
        where selected.choice_id = '' or not exists (
          select 1 from jsonb_array_elements(q.options) candidate_option
          where candidate_option->>'id' = selected.choice_id
        )
      )
  ) then
    raise exception 'Jawaban tidak cocok dengan pertanyaan kuis.';
  end if;

  select count(*) into attempt_count
  from public.quiz_attempts a where a.student_id = student and a.quiz_id = quiz_id_input;
  if attempt_count >= quiz.max_attempts or (not quiz.allow_retake and attempt_count > 0) then
    raise exception 'Kesempatan kuis sudah habis.';
  end if;

  insert into app_private.quiz_attempt_drafts(student_id, quiz_id, module_id, started_at, answers, updated_at)
  values (student, quiz_id_input, module_id_input, safe_started_at, answers_input, now())
  on conflict (student_id, quiz_id) do update set
    module_id = excluded.module_id,
    answers = excluded.answers,
    updated_at = now()
  where app_private.quiz_attempt_drafts.started_at = excluded.started_at
  returning updated_at into saved_at;

  if not found then
    raise exception 'Kuis ini sudah dimulai di sesi lain. Muat ulang untuk memulihkan jawaban tersimpan.';
  end if;

  return jsonb_build_object('ok', true, 'savedAt', saved_at);
end;
$$;

create or replace function public.get_learning_quiz_draft(module_id_input uuid, quiz_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  student uuid;
  draft app_private.quiz_attempt_drafts%rowtype;
begin
  student := app_private.lock_student_module(module_id_input);

  if not exists (
    select 1 from public.quizzes q
    where q.id = quiz_id_input and q.module_id = module_id_input and q.is_published
  ) then
    raise exception 'Kuis tidak ditemukan atau belum dipublikasikan.';
  end if;
  if exists (
    select 1 from public.lessons l
    where l.module_id = module_id_input
      and not exists (
        select 1 from public.lesson_progress lp
        where lp.lesson_id = l.id and lp.student_id = student and lp.completed_at is not null
      )
  ) then
    raise exception 'Selesaikan semua materi modul sebelum mengerjakan kuis.';
  end if;

  select * into draft
  from app_private.quiz_attempt_drafts d
  where d.student_id = student and d.quiz_id = quiz_id_input and d.module_id = module_id_input;
  if not found then return null; end if;

  return jsonb_build_object('startedAt', draft.started_at, 'answers', draft.answers, 'updatedAt', draft.updated_at);
end;
$$;

create or replace function app_private.clear_quiz_draft_after_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'graded' then
    delete from app_private.quiz_attempt_drafts d
    where d.student_id = new.student_id and d.quiz_id = new.quiz_id;
  end if;
  return null;
end;
$$;

drop trigger if exists clear_quiz_draft_after_submission on public.quiz_attempts;
create trigger clear_quiz_draft_after_submission
after insert or update on public.quiz_attempts
for each row execute function app_private.clear_quiz_draft_after_submission();

create or replace function public.reset_student_learning_data(
  class_id_input uuid,
  student_id_input uuid,
  module_id_input uuid default null,
  data_type_input text default 'all'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  caller_role public.app_role;
  class_teacher uuid;
  target_student uuid;
  module_ids uuid[];
  quiz_ids uuid[];
begin
  select p.role into caller_role from public.profiles p where p.id = caller;
  if caller is null or caller_role not in ('teacher'::public.app_role, 'admin'::public.app_role) then
    raise exception 'Akses guru atau admin diperlukan.';
  end if;
  if data_type_input not in ('progress', 'quiz', 'reflection', 'all') then
    raise exception 'Jenis data reset tidak valid.';
  end if;

  select c.teacher_id into class_teacher from public.classes c where c.id = class_id_input;
  if not found then raise exception 'Kelas tidak ditemukan.'; end if;
  if caller_role = 'teacher'::public.app_role and class_teacher <> caller then
    raise exception 'Kamu tidak memiliki akses ke kelas ini.';
  end if;

  select p.id into target_student
  from public.profiles p
  where p.id = student_id_input and p.role = 'student'::public.app_role and p.class_id = class_id_input
  for update;
  if not found then raise exception 'Siswa tidak ditemukan di kelas ini.'; end if;

  select coalesce(array_agg(m.id), '{}'::uuid[]) into module_ids
  from public.modules m
  where coalesce(m.created_by, m.teacher_id) = class_teacher
    and (module_id_input is null or m.id = module_id_input);
  if cardinality(module_ids) = 0 then
    raise exception 'Modul tidak ditemukan untuk guru kelas ini.';
  end if;

  select coalesce(array_agg(q.id), '{}'::uuid[]) into quiz_ids
  from public.quizzes q where q.module_id = any(module_ids);

  if data_type_input in ('progress', 'all') then
    delete from public.lesson_progress lp where lp.student_id = target_student and lp.module_id = any(module_ids);
    delete from public.module_progress mp where mp.student_id = target_student and mp.module_id = any(module_ids);
  end if;
  if data_type_input in ('quiz', 'all') then
    delete from public.quiz_attempts a where a.student_id = target_student and a.quiz_id = any(quiz_ids);
    delete from app_private.quiz_attempt_drafts d where d.student_id = target_student and d.quiz_id = any(quiz_ids);
  end if;
  if data_type_input in ('reflection', 'all') then
    delete from public.reflections r where r.student_id = target_student and r.module_id = any(module_ids);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.save_learning_quiz_draft(uuid, uuid, jsonb, timestamptz),
  public.get_learning_quiz_draft(uuid, uuid),
  public.reset_student_learning_data(uuid, uuid, uuid, text),
  app_private.clear_quiz_draft_after_submission() from public, anon;
revoke all on function app_private.clear_quiz_draft_after_submission() from authenticated;
grant execute on function public.save_learning_quiz_draft(uuid, uuid, jsonb, timestamptz),
  public.get_learning_quiz_draft(uuid, uuid),
  public.reset_student_learning_data(uuid, uuid, uuid, text) to authenticated;
