-- Learning writes run in one transaction and serialize on the student's profile.
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

create or replace function app_private.lock_student_module(target_module_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare student uuid := auth.uid();
begin
  perform 1 from public.profiles where id = student and role = 'student' for update;
  if not found then raise exception 'Sesi siswa belum aktif. Silakan masuk kembali.'; end if;
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

create or replace function app_private.refresh_learning_progress(student uuid, target_module uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  lesson_count integer; finished_count integer; quiz_required boolean; quiz_passed boolean;
  complete boolean; progress integer;
begin
  select count(*), count(lp.lesson_id) into lesson_count, finished_count
  from public.lessons l left join public.lesson_progress lp on lp.lesson_id = l.id
    and lp.student_id = student and lp.completed_at is not null where l.module_id = target_module;
  select exists(select 1 from public.quizzes q where q.module_id = target_module and q.is_published),
    exists(select 1 from public.quizzes q join public.quiz_attempts a on a.quiz_id = q.id
      where q.module_id = target_module and q.is_published and a.student_id = student and a.passed)
    into quiz_required, quiz_passed;
  complete := finished_count = lesson_count and (not quiz_required or quiz_passed);
  progress := case when complete then 100 when lesson_count = 0 then 0
    else least(case when quiz_required then 90 else 100 end,
      round(100.0 * finished_count / lesson_count)::integer) end;
  insert into public.module_progress(student_id,module_id,status,progress_percent,started_at,completed_at,last_accessed_at)
  values(student,target_module,case when complete then 'completed'::public.learning_status else 'in_progress'::public.learning_status end,
    progress,now(),case when complete then now() end,now())
  on conflict(student_id,module_id) do update set
    status=excluded.status, progress_percent=excluded.progress_percent,
    started_at=coalesce(public.module_progress.started_at,excluded.started_at),
    completed_at=case when complete then coalesce(public.module_progress.completed_at,now()) end,
    last_accessed_at=now();
  return progress;
end
$$;

create or replace function app_private.record_learning_activity(student uuid, reward integer default 0)
returns void language sql security definer set search_path = '' as $$
  update public.profiles set xp = coalesce(xp,0) + reward,
    streak_count = case
      when (last_active_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date
        then greatest(coalesce(streak_count,0),1)
      when (last_active_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date - 1
        then coalesce(streak_count,0)+1 else 1 end,
    last_active_at = now()
  where id = student;
$$;

create or replace function public.complete_learning_lesson(module_id_input uuid, lesson_id_input uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare student uuid; progress integer;
begin
  student := app_private.lock_student_module(module_id_input);
  if not exists(select 1 from public.lessons where id=lesson_id_input and module_id=module_id_input) then
    raise exception 'Pelajaran tidak ditemukan pada modul ini.';
  end if;
  insert into public.lesson_progress(student_id,module_id,lesson_id,completed_at)
  values(student,module_id_input,lesson_id_input,now())
  on conflict(student_id,lesson_id) do update set completed_at=coalesce(public.lesson_progress.completed_at,excluded.completed_at);
  progress := app_private.refresh_learning_progress(student,module_id_input);
  perform app_private.record_learning_activity(student);
  return jsonb_build_object('ok',true,'progressPercent',progress);
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
  safe_started_at := least(started_at_input,now());
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

create or replace function public.submit_learning_reflection(module_id_input uuid, reflection_input text, action_input text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare student uuid; existing boolean; progress integer;
begin
  student := app_private.lock_student_module(module_id_input);
  if char_length(trim(coalesce(reflection_input,''))) not between 30 and 500
    or char_length(trim(coalesce(action_input,''))) not between 20 and 500 then
    raise exception 'Panjang refleksi atau aksi nyata tidak valid.';
  end if;
  progress := app_private.refresh_learning_progress(student,module_id_input);
  if progress<100 then raise exception 'Refleksi belum terbuka. Selesaikan materi dan kuis terlebih dahulu.'; end if;
  select exists(select 1 from public.reflections where student_id=student and module_id=module_id_input) into existing;
  insert into public.reflections(student_id,module_id,reflection_text,action_plan)
    values(student,module_id_input,trim(reflection_input),trim(action_input))
    on conflict(student_id,module_id) do update set reflection_text=excluded.reflection_text,action_plan=excluded.action_plan;
  perform app_private.record_learning_activity(student,case when existing then 0 else 20 end);
  return jsonb_build_object('ok',true);
end
$$;

create or replace function public.claim_learning_achievements()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare student uuid:=auth.uid(); reward integer; earned jsonb;
begin
  perform 1 from public.profiles where id=student and role='student' for update;
  if not found then raise exception 'Sesi siswa belum aktif.'; end if;
  with inserted as (
    insert into public.student_achievements(student_id,achievement_id)
    select student,a.id from public.achievements a where case a.code
      when 'consistent_learner' then exists(select 1 from public.profiles p where p.id=student and p.streak_count>=7
        and (p.last_active_at at time zone 'Asia/Jakarta')::date >= (now() at time zone 'Asia/Jakarta')::date-1)
      when 'deep_understanding' then exists(select 1 from public.quiz_attempts where student_id=student and score>=80)
      when 'real_action' then exists(select 1 from public.reflections where student_id=student)
      when 'explorer' then (select count(*) from public.module_progress where student_id=student and status in ('in_progress','completed'))>=3
      else false end
    on conflict(student_id,achievement_id) do nothing returning achievement_id,earned_at
  ) select coalesce(sum(a.xp_reward),0),coalesce(jsonb_agg(jsonb_build_object('achievement_id',i.achievement_id,'earned_at',i.earned_at)),'[]'::jsonb)
    into reward,earned from inserted i join public.achievements a on a.id=i.achievement_id;
  if reward>0 then update public.profiles set xp=coalesce(xp,0)+reward where id=student; end if;
  return jsonb_build_object('addedXp',reward,'studentAchievements',earned);
end
$$;

-- Direct REST writes must not bypass grading, attempt limits, or reward eligibility.
create or replace function app_private.guard_learning_writes()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_table_name='profiles' then
      if new.xp is distinct from old.xp or new.streak_count is distinct from old.streak_count
        or new.last_active_at is distinct from old.last_active_at then
        raise exception 'Poin dan aktivitas hanya dapat diubah oleh sistem.';
      end if;
    elsif app_private.is_student() then
      raise exception 'Gunakan alur pembelajaran untuk menyimpan hasil.';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end
$$;
create trigger guard_profile_rewards before update on public.profiles
  for each row execute function app_private.guard_learning_writes();
create trigger guard_quiz_attempt_writes before insert or update or delete on public.quiz_attempts
  for each row execute function app_private.guard_learning_writes();
create trigger guard_module_progress_writes before insert or update or delete on public.module_progress
  for each row execute function app_private.guard_learning_writes();
create trigger guard_lesson_progress_writes before insert or update or delete on public.lesson_progress
  for each row execute function app_private.guard_learning_writes();
create trigger guard_reflection_writes before insert or update or delete on public.reflections
  for each row execute function app_private.guard_learning_writes();
create trigger guard_achievement_writes before insert or update or delete on public.student_achievements
  for each row execute function app_private.guard_learning_writes();

revoke all on function app_private.lock_student_module(uuid), app_private.refresh_learning_progress(uuid,uuid),
  app_private.record_learning_activity(uuid,integer), app_private.guard_learning_writes() from public,anon,authenticated;
revoke all on function public.complete_learning_lesson(uuid,uuid), public.submit_learning_quiz(uuid,uuid,jsonb,timestamptz),
  public.submit_learning_reflection(uuid,text,text), public.claim_learning_achievements() from public,anon;
grant execute on function public.complete_learning_lesson(uuid,uuid), public.submit_learning_quiz(uuid,uuid,jsonb,timestamptz),
  public.submit_learning_reflection(uuid,text,text), public.claim_learning_achievements() to authenticated;
