create or replace function public.validate_teacher_invite_code(input_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teacher_invite_codes tic
    where upper(trim(tic.code)) = upper(trim(input_code))
      and tic.is_active = true
      and tic.used_at is null
      and (tic.expires_at is null or tic.expires_at > now())
  )
$$;

create or replace function public.validate_class_code(input_class_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    where upper(trim(c.class_code)) = upper(trim(input_class_code))
  )
$$;

revoke execute on function public.validate_teacher_invite_code(text) from public;
revoke execute on function public.validate_class_code(text) from public;
grant execute on function public.validate_teacher_invite_code(text) to anon, authenticated;
grant execute on function public.validate_class_code(text) to anon, authenticated;
