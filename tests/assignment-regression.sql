begin;
do $test$
declare
  v_teacher_id uuid;
  v_student_id uuid;
  first_class_id uuid := gen_random_uuid();
  second_class_id uuid := gen_random_uuid();
  task_id uuid;
  isolated_task_id uuid;
  late_task_id uuid;
  submission_id uuid;
  attachment_path text;
  submission_status text;
  submission_score integer;
  denied boolean;
begin
  select id into v_teacher_id from public.profiles where email = 'demilebusiness@gmail.com' and role = 'teacher';
  select id into v_student_id from public.profiles where email = 'alzacebong@gmail.com' and role = 'student';
  if v_teacher_id is null or v_student_id is null then raise exception 'Assignment test fixtures are missing'; end if;

  insert into public.classes (id, teacher_id, name) values
    (first_class_id, v_teacher_id, 'Assignment audit class'),
    (second_class_id, v_teacher_id, 'Assignment isolation class');
  update public.profiles set class_id = first_class_id where id = v_student_id;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  task_id := public.create_class_assignment(
    first_class_id, 'Tugas audit kelas', 'Jelaskan jawabanmu dengan contoh yang jelas.', now() + interval '2 days'
  );
  isolated_task_id := public.create_class_assignment(
    second_class_id, 'Tugas kelas lain', 'Jelaskan jawabanmu dengan contoh yang jelas.', null
  );
  late_task_id := public.create_class_assignment(
    first_class_id, 'Tugas batas waktu', 'Jelaskan jawabanmu dengan contoh yang jelas.', now() + interval '1 day'
  );
  execute 'reset role';
  attachment_path := v_student_id::text || '/' || task_id::text || '/123e4567-e89b-42d3-a456-426614174000.pdf';
  update public.class_assignments set due_at = now() - interval '1 minute' where id = late_task_id;

  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  execute 'set local role authenticated';
  if not exists (select 1 from public.class_assignments where id = task_id) then
    raise exception 'Student cannot read a task for their class';
  end if;
  if exists (select 1 from public.class_assignments where id = isolated_task_id) then
    raise exception 'Student can read a task for a different class';
  end if;

  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values ('assignment-submissions', attachment_path, v_student_id::text, '{"size":1024,"mimetype":"application/pdf"}'::jsonb);
  denied := false;
  begin
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'assignment-submissions',
      v_student_id::text || '/' || isolated_task_id::text || '/223e4567-e89b-42d3-a456-426614174000.pdf',
      v_student_id::text,
      '{"size":1024,"mimetype":"application/pdf"}'::jsonb
    );
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Student uploaded a file for a task in a different class'; end if;
  denied := false;
  begin
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'assignment-submissions',
      v_student_id::text || '/' || task_id::text || '/not-a-generated-path.exe',
      v_student_id::text,
      '{"size":1024,"mimetype":"application/pdf"}'::jsonb
    );
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Storage accepted an invalid attachment object path'; end if;

  submission_id := public.submit_class_assignment(task_id, null, attachment_path, 'jawaban.pdf', 1024, 'application/pdf');
  if not exists (
    select 1 from storage.objects where bucket_id = 'assignment-submissions' and name = attachment_path
  ) then
    raise exception 'Student cannot read their submitted private attachment';
  end if;
  if (select file_path from public.assignment_submissions where id = submission_id) <> attachment_path then
    raise exception 'File-only submission was not saved';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  execute 'set local role authenticated';
  if not exists (
    select 1 from storage.objects where bucket_id = 'assignment-submissions' and name = attachment_path
  ) then
    raise exception 'Assigned teacher cannot read the submitted private attachment';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  execute 'set local role authenticated';
  perform public.submit_class_assignment(
    task_id, 'Saya menjaga keseimbangan dengan membuat jadwal belajar dan istirahat.'
  );
  if (select file_path from public.assignment_submissions where id = submission_id) is not null then
    raise exception 'Text resubmission did not remove the old attachment reference';
  end if;
  perform public.submit_class_assignment(
    task_id, 'Saya memperbarui jawaban dengan memberi waktu untuk belajar dan istirahat.'
  );
  if (select count(*) from public.assignment_submissions s where s.assignment_id = task_id and s.student_id = v_student_id) <> 1 then
    raise exception 'Resubmission created a duplicate row';
  end if;

  denied := false;
  begin
    insert into public.assignment_submissions (assignment_id, student_id, answer)
    values (task_id, v_student_id, 'A direct write should be denied by table grants.');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Direct submission table writes are allowed'; end if;

  denied := false;
  begin
    perform public.submit_class_assignment(late_task_id, 'This late answer should not be accepted.');
  exception when raise_exception then denied := true;
  end;
  if not denied then raise exception 'A submission after the deadline was accepted'; end if;

  denied := false;
  begin
    perform public.review_class_assignment(submission_id, 90, 'Student review must be rejected.');
  exception when raise_exception then denied := true;
  end;
  if not denied then raise exception 'A student was allowed to review a submission'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  execute 'set local role authenticated';
  select status, score into submission_status, submission_score
  from public.assignment_submissions where id = submission_id;
  if submission_status <> 'submitted' or submission_score is not null then
    raise exception 'Teacher could not see an unreviewed submission';
  end if;
  perform public.review_class_assignment(submission_id, 88, 'Contoh yang diberikan sudah jelas.');
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  execute 'set local role authenticated';
  select status, score into submission_status, submission_score
  from public.assignment_submissions where id = submission_id;
  if submission_status <> 'reviewed' or submission_score <> 88 then
    raise exception 'Student cannot see the saved score';
  end if;
  denied := false;
  begin
    perform public.submit_class_assignment(task_id, 'A reviewed answer must stay locked for editing.');
  exception when raise_exception then denied := true;
  end;
  if not denied then raise exception 'A reviewed submission could be changed'; end if;
  execute 'reset role';
end
$test$;
rollback;
select 'PASS: scoped task visibility, text and file submissions, private attachment access, upload path/class enforcement, resubmission, late cutoff, database write protection, teacher grading, and reviewed-answer lock. Fixtures rolled back.' as result;
