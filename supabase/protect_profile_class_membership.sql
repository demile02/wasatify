create or replace function app_private.current_profile_class_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.class_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

revoke all on function app_private.current_profile_class_id() from public, anon;
grant execute on function app_private.current_profile_class_id() to authenticated;

drop policy if exists "profiles_insert_authenticated" on public.profiles;
create policy "profiles_insert_authenticated"
on public.profiles for insert
to authenticated
with check (app_private.is_admin());

drop policy if exists "profiles_update_authenticated" on public.profiles;
create policy "profiles_update_authenticated"
on public.profiles for update
to authenticated
using (
  app_private.is_admin()
  or id = (select auth.uid())
)
with check (
  app_private.is_admin()
  or (
    id = (select auth.uid())
    and role = app_private.current_profile_role()
    and class_id is not distinct from app_private.current_profile_class_id()
  )
);
