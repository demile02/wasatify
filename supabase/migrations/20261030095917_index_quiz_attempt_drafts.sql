create index if not exists quiz_attempt_drafts_quiz_id_idx
  on app_private.quiz_attempt_drafts (quiz_id);
create index if not exists quiz_attempt_drafts_module_id_idx
  on app_private.quiz_attempt_drafts (module_id);
