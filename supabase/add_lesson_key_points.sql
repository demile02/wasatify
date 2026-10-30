alter table public.lessons
  add column if not exists key_points jsonb
  check (key_points is null or jsonb_typeof(key_points) = 'array');
