-- 001_auth_and_elo.sql
-- Bootstrap auth (own-rolled) + ELO + game history.
-- Idempotent: every CREATE uses IF NOT EXISTS so re-running is safe.

create extension if not exists citext;
create extension if not exists pgcrypto;

-- =============================================================
-- Auth: users + DB-backed sessions
-- =============================================================

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         citext unique not null,
  password_hash text not null,
  handle        citext unique not null,
  display_name  text not null,
  created_at    timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_]{3,20}$')
);

-- token_hash stores SHA-256(raw cookie token). Raw token never hits disk,
-- so a DB dump does not leak active sessions.
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  token_hash    text unique not null,
  user_agent    text,
  ip_address    inet,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_used_at  timestamptz not null default now()
);
create index if not exists sessions_token_hash_idx on public.sessions (token_hash);
create index if not exists sessions_user_id_idx    on public.sessions (user_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

-- =============================================================
-- ELO + game history
-- =============================================================

create table if not exists public.elo_ratings (
  user_id        uuid primary key references public.users(id) on delete cascade,
  rating         integer not null default 1200,
  games_played   integer not null default 0,
  rounds_played  integer not null default 0,
  peak_rating    integer not null default 1200,
  last_played    timestamptz,
  updated_at     timestamptz not null default now()
);

create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  room_code     text not null,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  total_rounds  integer not null,
  player_count  integer not null
);
create index if not exists games_started_at_idx on public.games (started_at desc);

-- One row per (game, round, player). guest_label is set when user_id is null
-- (anonymous players still get round_results so the game log is complete; they
-- just don't carry ELO).
create table if not exists public.round_results (
  id             bigserial primary key,
  game_id        uuid not null references public.games(id) on delete cascade,
  round_number   integer not null,
  user_id        uuid references public.users(id) on delete set null,
  guest_label    text,
  score          integer not null,
  rank           integer not null,
  rating_before  integer,
  rating_after   integer,
  rating_delta   integer,
  created_at     timestamptz not null default now()
);
create index if not exists round_results_user_idx on public.round_results (user_id, created_at desc);
create index if not exists round_results_game_idx on public.round_results (game_id, round_number);

-- Convenience view for the home-page leaderboard.
create or replace view public.leaderboard as
select
  u.id            as user_id,
  u.handle,
  u.display_name,
  er.rating,
  er.games_played,
  er.rounds_played,
  er.peak_rating,
  er.last_played
from public.users u
join public.elo_ratings er on er.user_id = u.id
where er.games_played > 0
order by er.rating desc;
