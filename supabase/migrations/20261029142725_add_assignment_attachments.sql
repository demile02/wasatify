alter table public.assignment_submissions
  alter column answer drop not null;

alter table public.assignment_submissions
  drop constraint if exists assignment_submissions_answer_check;

alter table public.assignment_submissions
  add column file_path text,
  add column file_name text,
  add column file_size bigint,
  add column file_type text;

alter table public.assignment_submissions
  add constraint assignment_submissions_answer_or_file_check
  check (
    (answer is null or char_length(btrim(answer)) between 20 and 5000)
    and (
      (answer is not null and char_length(btrim(answer)) between 20 and 5000)
      or file_path is not null
    )
  ),
  add constraint assignment_submissions_file_metadata_check
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
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp'
      )
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-submissions',
  'assignment-submissions',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy assignment_submission_files_upload_scoped
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and app_private.is_student()
  and exists (
    select 1
    from public.class_assignments a
    where a.id::text = (storage.foldername(name))[2]
      and a.class_id = (select app_private.current_profile_class_id())
  )
);

create policy assignment_submission_files_read_scoped
on storage.objects for select
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and exists (
    select 1
    from public.assignment_submissions s
    join public.class_assignments a on a.id = s.assignment_id
    where s.file_path = storage.objects.name
      and (
        s.student_id = (select auth.uid())
        or a.teacher_id = (select auth.uid())
        or (select app_private.is_admin())
      )
  )
);

create policy assignment_submission_files_delete_scoped
on storage.objects for delete
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and app_private.is_student()
  and exists (
    select 1
    from public.class_assignments a
    where a.id::text = (storage.foldername(name))[2]
      and a.class_id = (select app_private.current_profile_class_id())
  )
  and not exists (
    select 1
    from public.assignment_submissions s
    where s.file_path = storage.objects.name
      and s.status = 'reviewed'
  )
);

drop function public.submit_class_assignment(uuid, text);

create function public.submit_class_assignment(
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
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp'
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
    ) returning id into submission_id;
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
