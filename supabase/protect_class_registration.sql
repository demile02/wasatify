drop policy if exists "classes_select_public_registration" on public.classes;
revoke select on public.classes from anon;
drop function if exists public.get_public_classes_for_registration();

alter function public.set_updated_at() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
