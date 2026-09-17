-- Adds optional charity/event context to events and fills it in for 10/10/2026.
-- Run in the Supabase SQL editor on a database that already has the base schema.
-- (schema.sql includes the same statements, so a fresh install doesn't need this file.)

alter table public.events add column if not exists charity_info text;
alter table public.events add column if not exists image_url    text;

update public.events
   set charity_info = $charity$Diego is running the 2026 TCS New York City Marathon with Team for Kids — one of New York Road Runners' oldest and largest charity partners — which means every entry comes with a real fundraising commitment to hit, not just a race to finish.

Every dollar raised goes toward NYRR's free youth and community programs, helping remove barriers to exercise and build healthier habits for kids across New York.

100% of proceeds from today's headshots go straight to Diego's fundraising goal. Bookings close October 10, 2026 — the day of the shoot.$charity$
 where event_date = date '2026-10-10' and name = 'Charity Headshot Day';

-- Sanity check — expect 1 row with the blurb and a null image_url.
select name, event_date, left(charity_info, 40) as charity_info_preview, image_url
  from public.events
 where event_date = date '2026-10-10';
