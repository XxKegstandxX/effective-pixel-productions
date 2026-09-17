-- Rate limiting for the "Find my booking" lookup (no Redis — a tiny table).
-- Run in the Supabase SQL editor on a database that already has the base schema.
-- (schema.sql includes the same statements, so a fresh install doesn't need this file.)

create table if not exists public.lookup_attempts (
  id            bigserial primary key,
  key           text not null,          -- e.g. "ip:203.0.113.5"
  attempted_at  timestamptz not null default now()
);

create index if not exists lookup_attempts_key_time_idx on public.lookup_attempts (key, attempted_at);
create index if not exists lookup_attempts_time_idx     on public.lookup_attempts (attempted_at);

-- No policies → anon/authenticated can't touch it; service role bypasses RLS.
alter table public.lookup_attempts enable row level security;

-- -----------------------------------------------------------------------------
-- register_lookup_attempt(key, limit, window): record one attempt and report
-- whether it's within the limit. true = allowed, false = rate limited.
-- Old rows are pruned opportunistically so the table stays tiny.
-- -----------------------------------------------------------------------------
create or replace function public.register_lookup_attempt(
  p_key            text,
  p_limit          integer default 5,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  delete from public.lookup_attempts where attempted_at < now() - interval '1 hour';

  select count(*) into recent
    from public.lookup_attempts
   where key = p_key
     and attempted_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_limit then
    return false;
  end if;

  insert into public.lookup_attempts (key) values (p_key);
  return true;
end;
$$;

revoke all on function public.register_lookup_attempt(text, integer, integer) from public, anon, authenticated;
