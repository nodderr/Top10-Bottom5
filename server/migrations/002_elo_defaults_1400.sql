-- 002_elo_defaults_1400.sql
-- Align ELO defaults with the FFA ELO spec (base 1400, K=32, range 500..2500).
-- Existing rows from migration 001 default to 1200; bump unplayed rows to 1400
-- so the system is internally consistent before any games are recorded.

alter table public.elo_ratings alter column rating       set default 1400;
alter table public.elo_ratings alter column peak_rating  set default 1400;

update public.elo_ratings
   set rating = 1400, peak_rating = 1400
 where games_played = 0
   and rating = 1200;
