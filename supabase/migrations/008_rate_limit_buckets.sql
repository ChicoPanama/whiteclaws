-- Shared rate limiting buckets (Vercel/serverless-safe)
-- Used by server-side API routes via the service role key.

create table if not exists public.rate_limit_buckets (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);

alter table public.rate_limit_buckets enable row level security;

-- Only service_role should read/write rate limit state.
do $$
begin
  -- Policy is additive and scoped to service_role only.
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limit_buckets'
      and policyname = 'service_role_all'
  ) then
    create policy "service_role_all"
      on public.rate_limit_buckets
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create or replace function public.rate_limit_check(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Defensive defaults: empty key or invalid config means "allow".
  if p_key is null or length(p_key) = 0 then
    return true;
  end if;
  if p_limit is null or p_limit <= 0 then
    return true;
  end if;
  if p_window_seconds is null or p_window_seconds <= 0 then
    return true;
  end if;

  -- Bucket by window start timestamp (epoch-aligned).
  v_window_start :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_buckets (key, window_start, count, updated_at)
  values (p_key, v_window_start, 1, now())
  on conflict (key, window_start)
  do update set
    count = public.rate_limit_buckets.count + 1,
    updated_at = now()
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Lock down function execution to service_role only (server-side).
revoke all on function public.rate_limit_check(text, integer, integer) from public;
grant execute on function public.rate_limit_check(text, integer, integer) to service_role;

