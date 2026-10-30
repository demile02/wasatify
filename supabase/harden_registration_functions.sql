alter function public.validate_teacher_invite_code(text) set search_path = '';
alter function public.validate_class_code(text) set search_path = '';
alter function public.handle_new_user() set search_path = '';

revoke execute on function public.validate_teacher_invite_code(text) from public;
revoke execute on function public.validate_class_code(text) from public;
grant execute on function public.validate_teacher_invite_code(text) to anon, authenticated;
grant execute on function public.validate_class_code(text) to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
