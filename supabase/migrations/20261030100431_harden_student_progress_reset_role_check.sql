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
  if caller is null or caller_role is null or caller_role not in ('teacher'::public.app_role, 'admin'::public.app_role) then
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

revoke all on function public.reset_student_learning_data(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.reset_student_learning_data(uuid, uuid, uuid, text) to authenticated;
