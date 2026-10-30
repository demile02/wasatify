alter table public.quiz_attempts add column if not exists question_snapshot jsonb;

create or replace function app_private.snapshot_quiz_attempt_questions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'question_type', q.question_type, 'question_text', q.question_text,
    'options', q.options, 'correct_answer', q.correct_answer, 'explanation', q.explanation,
    'show_explanation', q.show_explanation, 'points', q.points, 'order_index', q.order_index
  ) order by q.order_index, q.id), '[]'::jsonb)
  into new.question_snapshot from public.quiz_questions q where q.quiz_id = new.quiz_id;
  return new;
end;
$$;
revoke all on function app_private.snapshot_quiz_attempt_questions() from public, anon, authenticated;
create trigger snapshot_quiz_attempt_questions before insert on public.quiz_attempts
for each row execute function app_private.snapshot_quiz_attempt_questions();
