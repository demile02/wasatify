create or replace function app_private.lock_student_module(target_module_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare student uuid := auth.uid();
begin
  perform 1 from public.profiles where id = student and role = 'student' for update;
  if not found then raise exception 'Sesi siswa belum aktif. Silakan masuk kembali.'; end if;
  perform 1 from public.modules where id=target_module_id for share;
  if not app_private.student_can_read_module(target_module_id, student) then
    raise exception 'Modul ini tidak tersedia untuk kelasmu.';
  end if;
  if exists (
    select 1 from public.modules earlier join public.modules target on target.id = target_module_id
    where earlier.status = 'published'
      and coalesce(earlier.created_by, earlier.teacher_id) = coalesce(target.created_by, target.teacher_id)
      and (earlier.order_index, earlier.title, earlier.id) < (target.order_index, target.title, target.id)
      and not exists (select 1 from public.module_progress p where p.student_id = student
        and p.module_id = earlier.id and p.status = 'completed')
  ) then raise exception 'Modul masih terkunci. Selesaikan modul sebelumnya terlebih dahulu.'; end if;
  return student;
end
$$;

create or replace function public.submit_learning_quiz(module_id_input uuid, quiz_id_input uuid, answers_input jsonb, started_at_input timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student uuid; quiz public.quizzes%rowtype; attempt public.quiz_attempts%rowtype;
  attempt_count integer; had_passed boolean; question_count integer; correct_count integer; earned integer;
  safe_started_at timestamptz;
begin
  student := app_private.lock_student_module(module_id_input);
  select * into quiz from public.quizzes where id=quiz_id_input and module_id=module_id_input and is_published;
  if not found then raise exception 'Kuis tidak ditemukan atau belum dipublikasikan.'; end if;
  if exists(select 1 from public.lessons l where l.module_id=module_id_input and not exists(
    select 1 from public.lesson_progress lp where lp.lesson_id=l.id and lp.student_id=student and lp.completed_at is not null)) then
    raise exception 'Selesaikan semua materi modul sebelum mengerjakan kuis.';
  end if;
  if jsonb_typeof(answers_input) is distinct from 'object' or octet_length(answers_input::text)>32768 then
    raise exception 'Data jawaban kuis tidak valid.';
  end if;
  if started_at_input is null or not isfinite(started_at_input) then raise exception 'Waktu mulai kuis tidak valid.'; end if;
  if started_at_input > now() + interval '5 minutes' then raise exception 'Waktu perangkat terlalu maju. Periksa tanggal dan jam perangkat.'; end if;
  safe_started_at := started_at_input;
  -- A retry after a lost response returns the saved attempt rather than consuming another attempt.
  select * into attempt from public.quiz_attempts where student_id=student and quiz_id=quiz_id_input
    and started_at=started_at_input and status='graded' order by created_at desc limit 1;
  if not found then
    select count(*),coalesce(bool_or(passed),false) into attempt_count,had_passed
      from public.quiz_attempts where student_id=student and quiz_id=quiz_id_input;
    if attempt_count >= quiz.max_attempts or (not quiz.allow_retake and attempt_count>0) then
      raise exception 'Kesempatan kuis sudah habis.';
    end if;
    select count(*) into question_count from public.quiz_questions where quiz_id=quiz_id_input;
    if question_count=0 or question_count>100 then raise exception 'Kuis harus memiliki 1 sampai 100 pertanyaan.'; end if;
    if exists(select 1 from public.quiz_questions q where q.quiz_id=quiz_id_input
      and (jsonb_typeof(answers_input->q.id::text) is distinct from 'string' or length(answers_input->>q.id::text)=0)) then
      raise exception 'Masih ada pertanyaan yang belum dijawab.';
    end if;
    with weights as (
      select q.*,sum(points) over() as weight_sum,
        (100-question_count)*points::numeric/sum(points) over() as share
      from public.quiz_questions q where quiz_id=quiz_id_input
    ), portions as (
      select *,1+floor(share)::integer as base_points,
        row_number() over(order by share-floor(share) desc,order_index,id) as remainder_rank
      from weights
    ), grades as (
      select *,case when weight_sum=100 then points else base_points+
        case when remainder_rank <= 100-sum(base_points) over() then 1 else 0 end end as awarded_points,
        case when jsonb_typeof(correct_answer->'value')='array' then
          (select string_agg(value,'|' order by value) from jsonb_array_elements_text(correct_answer->'value'))
          else coalesce(correct_answer->>'value','') end as expected
      from portions
    )
    select count(*) filter(where answers_input->>id::text=expected),
      coalesce(sum(awarded_points) filter(where answers_input->>id::text=expected),0)
      into correct_count,earned from grades;
    insert into public.quiz_attempts(quiz_id,student_id,status,answers,score,total_points,earned_points,passed,
      total_questions,correct_answers,started_at,submitted_at)
    values(quiz_id_input,student,'graded',answers_input,earned,100,earned,earned>=quiz.passing_score,
      question_count,correct_count,safe_started_at,now()) returning * into attempt;
    perform app_private.refresh_learning_progress(student,module_id_input);
    perform app_private.record_learning_activity(student,case when attempt.passed and not had_passed then 50 else 0 end);
  end if;
  return jsonb_build_object('ok',true,'attemptId',attempt.id,'score',attempt.score,'totalPoints',attempt.total_points,
    'earnedPoints',attempt.earned_points,'correctAnswers',attempt.correct_answers,
    'wrongAnswers',attempt.total_questions-attempt.correct_answers,'totalQuestions',attempt.total_questions,
    'elapsedSeconds',greatest(0,round(extract(epoch from attempt.submitted_at-attempt.started_at))), 'passed',attempt.passed);
end
$$;

