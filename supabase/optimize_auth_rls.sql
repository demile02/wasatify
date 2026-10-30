do $$
declare
  policy_row record;
  updated_qual text;
  updated_check text;
  alter_statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~* 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]'
        or coalesce(with_check, '') ~* 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]'
      )
  loop
    updated_qual := policy_row.qual;
    updated_check := policy_row.with_check;

    if updated_qual ~* 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]'
      and position('select auth.uid() as uid' in lower(updated_qual)) = 0 then
      updated_qual := regexp_replace(
        updated_qual,
        'auth[.]uid[[:space:]]*[(][[:space:]]*[)]',
        '(select auth.uid())',
        'gi'
      );
    end if;

    if updated_check ~* 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]'
      and position('select auth.uid() as uid' in lower(updated_check)) = 0 then
      updated_check := regexp_replace(
        updated_check,
        'auth[.]uid[[:space:]]*[(][[:space:]]*[)]',
        '(select auth.uid())',
        'gi'
      );
    end if;

    if updated_qual is distinct from policy_row.qual
      or updated_check is distinct from policy_row.with_check then
      alter_statement := format(
        'alter policy %I on %I.%I',
        policy_row.policyname,
        policy_row.schemaname,
        policy_row.tablename
      );

      if updated_qual is not null then
        alter_statement := alter_statement || format(' using (%s)', updated_qual);
      end if;

      if updated_check is not null then
        alter_statement := alter_statement || format(' with check (%s)', updated_check);
      end if;

      execute alter_statement;
    end if;
  end loop;
end;
$$;
