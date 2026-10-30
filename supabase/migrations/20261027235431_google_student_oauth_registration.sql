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
    requested_teacher_code := upper(trim(coalesce(new.raw_user_meta_data->>'teacher_invite_code', '')));

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

create or replace function public.complete_google_student_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_class_code text;
  selected_class_id uuid;
  current_role public.app_role;
  current_class_id uuid;
begin
  requested_class_code := upper(trim(coalesce(new.raw_user_meta_data->>'class_code', '')));
  if requested_class_code = '' then
    return new;
  end if;

  select p.role, p.class_id
  into current_role, current_class_id
  from public.profiles p
  where p.id = new.id;

  if not found or current_role <> 'student'::public.app_role or current_class_id is not null then
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

revoke execute on function public.complete_google_student_registration() from public, anon, authenticated;

drop trigger if exists on_auth_user_student_registration_updated on auth.users;
create trigger on_auth_user_student_registration_updated
after update of raw_user_meta_data on auth.users
for each row
when (new.raw_user_meta_data->>'class_code' is distinct from old.raw_user_meta_data->>'class_code')
execute function public.complete_google_student_registration();
