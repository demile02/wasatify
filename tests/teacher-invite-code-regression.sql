begin;

do $$
declare
  suffix text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  email_code text := 'QA-EMAIL-' || suffix;
  google_code text := 'QA-GOOGLE-' || suffix;
  cancelled_code text := 'QA-CANCELLED-' || suffix;
  expired_code text := 'QA-EXPIRED-' || suffix;
  used_code text := 'QA-USED-' || suffix;
  boundary_code text := 'QA-BOUNDARY-' || suffix;
  email_user_id uuid := gen_random_uuid();
  google_user_id uuid := gen_random_uuid();
  candidate_id uuid;
  rejected_code text;
  rejected_google_id uuid;
  rejected_email text;
begin
  insert into public.teacher_invite_codes (code, expires_at, is_active)
  values
    (email_code, pg_catalog.clock_timestamp() + interval '1 day', true),
    (google_code, pg_catalog.clock_timestamp() + interval '1 day', true),
    (cancelled_code, pg_catalog.clock_timestamp() + interval '1 day', false),
    (expired_code, pg_catalog.clock_timestamp() - interval '1 second', true),
    (used_code, pg_catalog.clock_timestamp() + interval '1 day', true);

  update public.teacher_invite_codes
  set used_at = pg_catalog.clock_timestamp()
  where code = used_code;

  if not public.validate_teacher_invite_code(email_code)
    or not public.validate_teacher_invite_code(google_code)
  then
    raise exception 'Regression assertion failed: unused valid codes must validate.';
  end if;

  if public.validate_teacher_invite_code(cancelled_code)
    or public.validate_teacher_invite_code(expired_code)
    or public.validate_teacher_invite_code(used_code)
  then
    raise exception 'Regression assertion failed: cancelled, expired, or used codes validated.';
  end if;

  begin
    insert into public.teacher_invite_codes (code, expires_at, is_active)
    values (lower(email_code), pg_catalog.clock_timestamp() + interval '1 day', true);
    raise exception 'Regression assertion failed: normalized duplicate code was accepted.';
  exception
    when unique_violation then null;
  end;

  insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) values (
    email_user_id,
    'authenticated',
    'authenticated',
    'teacher-email-' || suffix || '@example.invalid',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', 'teacher', 'full_name', 'Email invite regression', 'teacher_invite_code', email_code),
    false,
    false
  );

  if not exists (
    select 1
    from public.teacher_invite_codes
    where code = email_code and used_by = email_user_id and used_at is not null
  ) or public.validate_teacher_invite_code(email_code) then
    raise exception 'Regression assertion failed: email signup did not consume its code exactly once.';
  end if;

  insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) values (
    google_user_id,
    'authenticated',
    'authenticated',
    'teacher-google-' || suffix || '@example.invalid',
    '{"provider":"google","providers":["google"]}'::jsonb,
    jsonb_build_object('role', 'student', 'full_name', 'Google invite regression'),
    true,
    false
  );

  update auth.users
  set raw_user_meta_data = jsonb_build_object(
    'role', 'teacher',
    'full_name', 'Google invite regression',
    'teacher_invite_code', google_code
  )
  where id = google_user_id;

  if not exists (
    select 1
    from public.teacher_invite_codes
    where code = google_code and used_by = google_user_id and used_at is not null
  ) or not exists (
    select 1 from public.profiles where id = google_user_id and role = 'teacher'::public.app_role
  ) or public.validate_teacher_invite_code(google_code) then
    raise exception 'Regression assertion failed: Google registration did not consume its code exactly once.';
  end if;

  foreach rejected_code in array array[email_code, google_code, cancelled_code, expired_code, used_code] loop
    candidate_id := gen_random_uuid();
    begin
      insert into auth.users (
        id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
      ) values (
        candidate_id,
        'authenticated',
        'authenticated',
        'rejected-email-' || candidate_id::text || '@example.invalid',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('role', 'teacher', 'full_name', 'Rejected email regression', 'teacher_invite_code', rejected_code),
        false,
        false
      );
      raise exception 'Regression assertion failed: email signup accepted an unavailable invite code.';
    exception
      when others then
        if sqlerrm = 'Regression assertion failed: email signup accepted an unavailable invite code.' then
          raise;
        end if;
        if sqlerrm <> 'Kode guru tidak valid atau sudah digunakan.' then
          raise;
        end if;
    end;

    if exists (select 1 from auth.users where id = candidate_id) then
      raise exception 'Regression assertion failed: rejected email signup remained in auth.users.';
    end if;
  end loop;

  foreach rejected_code in array array[email_code, google_code, cancelled_code, expired_code, used_code] loop
    rejected_google_id := gen_random_uuid();
    rejected_email := 'rejected-google-' || rejected_google_id::text || '@example.invalid';
    insert into auth.users (
      id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      rejected_google_id,
      'authenticated',
      'authenticated',
      rejected_email,
      '{"provider":"google","providers":["google"]}'::jsonb,
      jsonb_build_object('role', 'student', 'full_name', 'Rejected Google regression'),
      true,
      false
    );

    begin
      update auth.users
      set raw_user_meta_data = jsonb_build_object(
        'role', 'teacher',
        'full_name', 'Rejected Google regression',
        'teacher_invite_code', rejected_code
      )
      where id = rejected_google_id;
      raise exception 'Regression assertion failed: Google signup accepted an unavailable invite code.';
    exception
      when others then
        if sqlerrm = 'Regression assertion failed: Google signup accepted an unavailable invite code.' then
          raise;
        end if;
        if sqlerrm <> 'Kode guru tidak valid atau sudah digunakan.' then
          raise;
        end if;
    end;

    if not exists (
      select 1 from public.profiles where id = rejected_google_id and role = 'student'::public.app_role
    ) or exists (
      select 1
      from auth.users
      where id = rejected_google_id
        and raw_user_meta_data->>'teacher_invite_code' is not null
    ) then
      raise exception 'Regression assertion failed: rejected Google registration changed user or profile state.';
    end if;
  end loop;

  insert into public.teacher_invite_codes (code, expires_at, is_active)
  values (boundary_code, pg_catalog.clock_timestamp() + interval '500 milliseconds', true);

  candidate_id := app_private.lock_valid_teacher_invite_code(boundary_code);
  if candidate_id is null then
    raise exception 'Regression assertion failed: newly issued boundary code was immediately rejected.';
  end if;

  perform pg_catalog.pg_sleep(0.6);
  if app_private.lock_valid_teacher_invite_code(boundary_code) is not null then
    raise exception 'Regression assertion failed: code remained usable after it expired while locked.';
  end if;
end;
$$;

rollback;
