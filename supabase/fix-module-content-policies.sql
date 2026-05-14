-- Run this whole file in Supabase SQL Editor.
-- It fixes two separate needs:
-- 1. Students and teachers can read module contents.
-- 2. Teachers can create, edit, and delete module contents.

alter table public.module_contents enable row level security;

drop policy if exists "Authenticated users can read module content" on public.module_contents;

create policy "Authenticated users can read module content"
on public.module_contents for select
to authenticated
using (true);

drop policy if exists "Teachers can manage module content" on public.module_contents;

create policy "Teachers can manage module content"
on public.module_contents for all
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

select
  auth.uid() as current_user_id,
  users.name,
  users.email,
  users.role
from public.users
where users.id = auth.uid();

select
  'module_contents policies' as check_name,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'module_contents'
order by policyname;

select
  'saved module contents' as check_name,
  id,
  module_id,
  content_type,
  title,
  media_url
from public.module_contents
order by order_number, title;
