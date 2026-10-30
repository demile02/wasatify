drop table if exists pg_temp._wasatify_policy_snapshot;
drop table if exists pg_temp._wasatify_policy_target;

create temporary table _wasatify_policy_snapshot as
select schemaname, tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'classes', 'teacher_invite_codes', 'modules', 'lessons',
    'quizzes', 'quiz_questions', 'module_progress', 'lesson_progress',
    'quiz_attempts', 'reflections', 'achievements', 'student_achievements',
    'announcements', 'notification_reads', 'messages', 'message_reads',
    'media_assets', 'infographic_assets'
  );

create temporary table _wasatify_policy_target (
  tablename name not null,
  policyname name not null,
  role_name name not null,
  cmd text not null,
  using_expr text,
  check_expr text
);

do $$
declare
  table_name name;
  role_name name;
  action_name text;
  policy_row record;
  matching_count integer;
  using_expr text;
  check_expr text;
begin
  perform set_config('search_path', 'public, pg_catalog', true);

  if exists (
    select 1 from _wasatify_policy_snapshot
    where permissive <> 'PERMISSIVE'
  ) then
    raise exception 'Restrictive policies require manual consolidation';
  end if;

  for table_name in select distinct tablename from _wasatify_policy_snapshot loop
    foreach role_name in array array['anon'::name, 'authenticated'::name] loop
      foreach action_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        select
          count(*),
          string_agg('(' || coalesce(qual, 'true') || ')', ' OR ' order by policyname),
          string_agg('(' || coalesce(with_check, qual, 'true') || ')', ' OR ' order by policyname)
        into matching_count, using_expr, check_expr
        from _wasatify_policy_snapshot
        where tablename = table_name
          and cmd in ('ALL', action_name)
          and (role_name = any(roles) or 'public'::name = any(roles));

        if matching_count > 0 then
          insert into _wasatify_policy_target
          values (
            table_name,
            (table_name::text || '_' || lower(action_name) || '_' || role_name::text)::name,
            role_name,
            action_name,
            using_expr,
            check_expr
          );
        end if;
      end loop;
    end loop;
  end loop;

  for policy_row in select * from _wasatify_policy_snapshot loop
    execute format(
      'drop policy %I on public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  end loop;

  for policy_row in select * from _wasatify_policy_target loop
    if policy_row.cmd = 'INSERT' then
      execute format(
        'create policy %I on public.%I for insert to %I with check (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.role_name, policy_row.check_expr
      );
    elsif policy_row.cmd = 'UPDATE' then
      execute format(
        'create policy %I on public.%I for update to %I using (%s) with check (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.role_name, policy_row.using_expr, policy_row.check_expr
      );
    else
      execute format(
        'create policy %I on public.%I for %s to %I using (%s)',
        policy_row.policyname, policy_row.tablename,
        policy_row.cmd, policy_row.role_name, policy_row.using_expr
      );
    end if;
  end loop;
end $$;

drop table pg_temp._wasatify_policy_target;
drop table pg_temp._wasatify_policy_snapshot;
