-- Self-service reschedule / cancel support.
-- Run in the Supabase SQL editor on a database that already has the base schema.
-- (schema.sql includes the same statements, so a fresh install doesn't need this file.)

-- Refund bookkeeping for cancellations.
alter table public.bookings add column if not exists stripe_refund_id text;
alter table public.bookings add column if not exists refund_cents     integer;

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

revoke all on function public.event_starts_at(uuid) from public, anon, authenticated;
revoke all on function public.reschedule_booking(uuid, uuid, integer) from public, anon, authenticated;
