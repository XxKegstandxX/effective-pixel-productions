-- =============================================================================
-- Headshot booking schema
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run: everything is IF NOT EXISTS / CREATE OR REPLACE.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- events: one row per shoot day. Add a row per month for the recurring version.
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  event_date    date not null,
  start_time    time not null,
  end_time      time not null,
  slot_minutes  integer not null default 15 check (slot_minutes > 0),
  price_cents   integer not null check (price_cents >= 0),
  -- IANA zone the event runs in; slot timestamps are generated from
  -- event_date + start_time interpreted in this zone.
  timezone      text not null default 'America/New_York',
  -- Optional context shown on /headshots. Both nullable so plain
  -- (non-charity) events can leave them empty.
  charity_info  text,
  image_url     text,
  created_at    timestamptz not null default now()
);

-- Migration for databases created before these columns existed.
alter table public.events add column if not exists charity_info text;
alter table public.events add column if not exists image_url    text;

-- -----------------------------------------------------------------------------
-- slots: one row per bookable 15-minute window.
-- A 'held' slot whose held_until is in the past is treated as open by the app
-- (lazy expiry) and can be re-held by hold_slot() below.
-- -----------------------------------------------------------------------------
create table if not exists public.slots (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  status      text not null default 'open' check (status in ('open', 'held', 'booked')),
  held_until  timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id, start_time)
);

create index if not exists slots_event_id_start_time_idx on public.slots (event_id, start_time);

-- -----------------------------------------------------------------------------
-- bookings: one row per checkout attempt. Only 'confirmed' rows are real.
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  slot_id                   uuid not null references public.slots(id) on delete restrict,
  full_name                 text not null,
  email                     text not null,
  phone                     text not null,
  amount_cents              integer not null check (amount_cents >= 0),
  fee_covered               boolean not null default false,
  stripe_session_id         text unique,
  stripe_payment_intent_id  text,
  status                    text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  -- Set when the customer self-cancels (partial refund: amount minus Stripe's actual fee).
  stripe_refund_id          text,
  refund_cents              integer,
  created_at                timestamptz not null default now()
);

-- Migration for databases created before these columns existed.
alter table public.bookings add column if not exists stripe_refund_id text;
alter table public.bookings add column if not exists refund_cents     integer;

create index if not exists bookings_slot_id_idx on public.bookings (slot_id);

-- At most one confirmed booking per slot, enforced by the database.
create unique index if not exists bookings_one_confirmed_per_slot
  on public.bookings (slot_id) where status = 'confirmed';

-- -----------------------------------------------------------------------------
-- Row Level Security
-- The public site reads events + slots with the anon key (no PII in either).
-- bookings are never readable by anon; all writes go through the service role
-- from Next.js route handlers.
-- -----------------------------------------------------------------------------
alter table public.events   enable row level security;
alter table public.slots    enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "anon can read events" on public.events;
create policy "anon can read events" on public.events
  for select to anon, authenticated using (true);

drop policy if exists "anon can read slots" on public.slots;
create policy "anon can read slots" on public.slots
  for select to anon, authenticated using (true);

-- (no policies on bookings → anon/authenticated get nothing; service role bypasses RLS)

-- -----------------------------------------------------------------------------
-- Realtime: broadcast slot changes so the grid updates live.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'slots'
  ) then
    alter publication supabase_realtime add table public.slots;
  end if;
end $$;

-- Send the full row on UPDATE (needed so realtime payloads include status/held_until).
alter table public.slots replica identity full;

-- -----------------------------------------------------------------------------
-- generate_slots(event_id): (re)create every slot for an event from its
-- date/hours/slot_minutes. Idempotent — existing slots are left alone.
-- -----------------------------------------------------------------------------
create or replace function public.generate_slots(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  ev        public.events%rowtype;
  day_start timestamptz;
  day_end   timestamptz;
  cursor_ts timestamptz;
  inserted  integer := 0;
begin
  select * into ev from public.events where id = p_event_id;
  if not found then
    raise exception 'event % not found', p_event_id;
  end if;

  -- "2026-10-10 09:00" in the event's zone → absolute timestamptz
  day_start := (ev.event_date + ev.start_time) at time zone ev.timezone;
  day_end   := (ev.event_date + ev.end_time)   at time zone ev.timezone;

  cursor_ts := day_start;
  while cursor_ts + make_interval(mins => ev.slot_minutes) <= day_end loop
    insert into public.slots (event_id, start_time, end_time)
    values (ev.id, cursor_ts, cursor_ts + make_interval(mins => ev.slot_minutes))
    on conflict (event_id, start_time) do nothing;
    if found then inserted := inserted + 1; end if;
    cursor_ts := cursor_ts + make_interval(mins => ev.slot_minutes);
  end loop;

  return inserted;
end;
$$;

-- -----------------------------------------------------------------------------
-- hold_slot(slot_id, minutes): atomically claim a slot for checkout.
-- Succeeds only if the slot is open, or held with an expired hold.
-- Returns the updated row (0 rows = someone else has it).
-- -----------------------------------------------------------------------------
create or replace function public.hold_slot(p_slot_id uuid, p_hold_minutes integer default 10)
returns setof public.slots
language sql
security definer
set search_path = public
as $$
  update public.slots
     set status = 'held',
         held_until = now() + make_interval(mins => p_hold_minutes)
   where id = p_slot_id
     and (
       status = 'open'
       or (status = 'held' and held_until is not null and held_until < now())
     )
  returning *;
$$;

-- -----------------------------------------------------------------------------
-- event_starts_at(event_id): the absolute instant the event begins
-- (event_date + start_time in the event's timezone). Single source of truth
-- for the 24-hour change cutoff.
-- -----------------------------------------------------------------------------
create or replace function public.event_starts_at(p_event_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select (event_date + start_time) at time zone timezone
    from public.events
   where id = p_event_id;
$$;

-- -----------------------------------------------------------------------------
-- reschedule_booking(booking_id, new_slot_id, cutoff_hours):
-- move a confirmed booking to another open slot on the same event, atomically.
-- Raises one of: BOOKING_NOT_FOUND, BOOKING_NOT_CONFIRMED, CUTOFF_PASSED,
-- SAME_SLOT, SLOT_UNAVAILABLE. Returns the new slot row.
-- -----------------------------------------------------------------------------
create or replace function public.reschedule_booking(
  p_booking_id   uuid,
  p_new_slot_id  uuid,
  p_cutoff_hours integer default 24
)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  b        public.bookings%rowtype;
  old_slot public.slots%rowtype;
  new_slot public.slots%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.status <> 'confirmed' then raise exception 'BOOKING_NOT_CONFIRMED'; end if;

  select * into old_slot from public.slots where id = b.slot_id for update;

  if now() >= public.event_starts_at(old_slot.event_id) - make_interval(hours => p_cutoff_hours) then
    raise exception 'CUTOFF_PASSED';
  end if;
  if p_new_slot_id = old_slot.id then raise exception 'SAME_SLOT'; end if;

  -- Claim the new slot only if it's open (or its hold has lapsed) on the same event.
  update public.slots
     set status = 'booked', held_until = null
   where id = p_new_slot_id
     and event_id = old_slot.event_id
     and (status = 'open' or (status = 'held' and held_until is not null and held_until < now()))
  returning * into new_slot;
  if not found then raise exception 'SLOT_UNAVAILABLE'; end if;

  update public.bookings set slot_id = new_slot.id where id = b.id;
  update public.slots set status = 'open', held_until = null where id = old_slot.id;

  return new_slot;
end;
$$;

-- Only the service role may call these.
revoke all on function public.generate_slots(uuid) from public, anon, authenticated;
revoke all on function public.hold_slot(uuid, integer) from public, anon, authenticated;
revoke all on function public.event_starts_at(uuid) from public, anon, authenticated;
revoke all on function public.reschedule_booking(uuid, uuid, integer) from public, anon, authenticated;

-- =============================================================================
-- SEED: the 10/10/2026 charity event + its 32 slots
-- =============================================================================
insert into public.events (name, event_date, start_time, end_time, slot_minutes, price_cents, timezone)
select 'Charity Headshot Day', date '2026-10-10', time '09:00', time '17:00', 15, 8500, 'America/New_York'
where not exists (
  select 1 from public.events where event_date = date '2026-10-10' and name = 'Charity Headshot Day'
);

select public.generate_slots(id) as slots_created
from public.events
where event_date = date '2026-10-10' and name = 'Charity Headshot Day';

-- Charity blurb for the 10/10 event (image_url intentionally left null for now).
update public.events
   set charity_info = $charity$Diego is running the 2026 TCS New York City Marathon with Team for Kids — one of New York Road Runners' oldest and largest charity partners — which means every entry comes with a real fundraising commitment to hit, not just a race to finish.

Every dollar raised goes toward NYRR's free youth and community programs, helping remove barriers to exercise and build healthier habits for kids across New York.

100% of proceeds from today's headshots go straight to Diego's fundraising goal. Bookings close October 10, 2026 — the day of the shoot.$charity$
 where event_date = date '2026-10-10' and name = 'Charity Headshot Day';

-- Sanity check — expect 32 rows, 09:00 → 16:45 local.
select count(*) as slot_count,
       min(s.start_time at time zone 'America/New_York') as first_slot,
       max(s.start_time at time zone 'America/New_York') as last_slot
from public.slots s
join public.events e on e.id = s.event_id
where e.event_date = date '2026-10-10';
