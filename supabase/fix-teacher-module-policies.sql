drop policy if exists "Teachers can manage modules" on public.modules;

create policy "Teachers can manage modules"
on public.modules for all
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
  created_by = auth.uid()
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
  )
);

drop policy if exists "Teachers can read student profiles" on public.users;

create policy "Teachers can read student profiles"
on public.users for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.users teacher
    where teacher.id = auth.uid()
      and teacher.role = 'teacher'
  )
);

select id, name, email, role
from public.users
where id = auth.uid();

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
