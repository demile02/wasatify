create schema if not exists app_private;

create table app_private.password_reset_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  attempts integer not null check (attempts > 0),
  window_started_at timestamptz not null,
  last_seen_at timestamptz not null
);

create index password_reset_rate_limits_last_seen_idx
  on app_private.password_reset_rate_limits (last_seen_at);

alter table app_private.password_reset_rate_limits enable row level security;
revoke all on table app_private.password_reset_rate_limits
  from public, anon, authenticated, service_role;

create or replace function public.claim_password_reset_rate_limit(
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  current_attempts integer;
  current_window_started_at timestamptz;
  request_allowed boolean;
  retry_after_seconds integer := 0;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_max_requests is null or p_max_requests < 1 or p_max_requests > 1000
    or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400
  then
    raise exception 'Invalid rate-limit parameters.';
  end if;

  if pg_catalog.pg_try_advisory_xact_lock(827341605214::bigint) then
    delete from app_private.password_reset_rate_limits
    where last_seen_at < v_now - interval '24 hours';
  end if;

  insert into app_private.password_reset_rate_limits as stored_limit (
    key_hash,
    attempts,
    window_started_at,
    last_seen_at
  )
  values (p_key_hash, 1, v_now, v_now)
  on conflict (key_hash) do update
    set attempts = case
          when stored_limit.window_started_at
            + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
            then 1
          else least(stored_limit.attempts + 1, p_max_requests + 1)
        end,
        window_started_at = case
          when stored_limit.window_started_at
            + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
            then v_now
          else stored_limit.window_started_at
        end,
        last_seen_at = v_now
  returning attempts, window_started_at
  into current_attempts, current_window_started_at;

  request_allowed := current_attempts <= p_max_requests;
  if not request_allowed then
    retry_after_seconds := greatest(
      1,
      pg_catalog.ceil(extract(epoch from (
        current_window_started_at
        + pg_catalog.make_interval(secs => p_window_seconds)
        - v_now
      )))::integer
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'allowed', request_allowed,
    'retry_after_seconds', retry_after_seconds
  );
end;
$$;

revoke execute on function public.claim_password_reset_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_password_reset_rate_limit(text, integer, integer)
  to service_role;
