alter table public.teacher_invite_codes
  add column if not exists teacher_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.teacher_invite_codes'::regclass
      and conname = 'teacher_invite_codes_teacher_name_length'
  ) then
    alter table public.teacher_invite_codes
      add constraint teacher_invite_codes_teacher_name_length
      check (teacher_name is null or char_length(btrim(teacher_name)) between 1 and 120);
  end if;
end;
$$;
