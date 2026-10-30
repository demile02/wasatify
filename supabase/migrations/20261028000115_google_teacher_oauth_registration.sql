drop trigger if exists on_auth_user_student_registration_updated on auth.users;
drop function if exists public.complete_google_student_registration();

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
  current_role public.app_role;
  current_class_id uuid;
begin
  requested_class_code := upper(trim(coalesce(new.raw_user_meta_data->>'class_code', '')));
  requested_teacher_code := upper(trim(coalesce(new.raw_user_meta_data->>'teacher_invite_code', '')));
  if requested_class_code = '' and requested_teacher_code = '' then
    return new;
  end if;

  select p.role, p.class_id
  into current_role, current_class_id
  from public.profiles p
  where p.id = new.id
  for update;

  if not found
    or current_role <> 'student'::public.app_role
    or current_class_id is not null
    or new.raw_app_meta_data->>'provider' <> 'google'
  then
    return new;
  end if;

  if requested_teacher_code <> '' then
    select tic.id
    into teacher_invite_id
    from public.teacher_invite_codes tic
    where upper(trim(tic.code)) = requested_teacher_code
      and tic.is_active = true
      and tic.used_at is null
      and (tic.expires_at is null or tic.expires_at > now())
    for update;

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

drop trigger if exists on_auth_user_registration_metadata_updated on auth.users;
create trigger on_auth_user_registration_metadata_updated
after update of raw_user_meta_data on auth.users
for each row
when (
  new.raw_user_meta_data->>'class_code' is distinct from old.raw_user_meta_data->>'class_code'
  or new.raw_user_meta_data->>'teacher_invite_code' is distinct from old.raw_user_meta_data->>'teacher_invite_code'
)
execute function public.complete_google_registration();
