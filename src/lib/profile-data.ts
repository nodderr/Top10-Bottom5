// Batched loader for leaderboard profile data. Runs 3 queries to fetch
// summaries, timelines, and recent games for any number of users in one shot —
// vastly cheaper than calling the per-user API endpoint 100 times.

import { pool } from '@/lib/db';

export interface TimelinePoint {
  ts: string;
  rating: number;
  delta: number | null;
  roomCode: string;
  roundNumber: number;
}

export interface RecentGame {
  gameId: string;
  roomCode: string;
  endedAt: string | null;
  startedAt: string;
  totalRounds: number;
  finalRank: number;
  scoreSum: number;
  totalDelta: number;
}

export interface ProfileData {
  handle: string;
  displayName: string;
  memberSince: string;
  rank: number | null;
  totalRanked: number;
  rating: number | null;
  peakRating: number | null;
  gamesPlayed: number;
  roundsPlayed: number;
  lastPlayed: string | null;
  ratingDelta7d: number | null;
  winRate: number;
  bestRoundScore: number | null;
  /**
   * Best round-finish position (1 = won the round) and the date it was first
   * achieved. Null when the user has no completed rounds.
   */
  peakRank: { rank: number; achievedAt: string } | null;
  /** Full timeline (no range filter). Client-side chips slice it. */
  timeline: TimelinePoint[];
  recentGames: RecentGame[];
}

interface SummaryRow {
  user_id: string;
  handle: string;
  display_name: string;
  created_at: Date;
  rating: number;
  peak_rating: number;
  games_played: number;
  rounds_played: number;
  last_played: Date | null;
  rnk: number;
  total: number;
  win_rounds: number | null;
  total_rounds: number | null;
  best_score: number | null;
  peak_rank: number | null;
  peak_rank_at: Date | null;
  rating_7d_ago: number | null;
}

interface TimelineRow {
  user_id: string;
  ts: Date;
  rating: number;
  delta: number | null;
  room_code: string;
  round_number: number;
}

interface RecentGameRow {
  user_id: string;
  game_id: string;
  room_code: string;
  ended_at: Date | null;
  started_at: Date;
  total_rounds: number;
  score_sum: number;
  total_delta: number | null;
  final_rank: number;
}

/**
 * Fetch full profile data for the given users. Returns a Map keyed by handle.
 * One query each: summary (incl. rank + 7d-ago rating), timeline, recent games.
 */
export async function loadProfilesByHandle(
  userIds: string[],
): Promise<Map<string, ProfileData>> {
  if (userIds.length === 0) return new Map();

  const [summaryQ, timelineQ, recentQ] = await Promise.all([
    pool.query<SummaryRow>(
      `with ranked as (
         select er.user_id, er.rating, er.peak_rating, er.games_played,
                er.rounds_played, er.last_played,
                rank() over (order by er.rating desc, er.peak_rating desc, u.created_at asc) as rnk,
                count(*) over () as total
         from public.elo_ratings er
         join public.users u on u.id = er.user_id
       ),
       summary as (
         select rr.user_id,
                sum(case when rr.rank = 1 then 1 else 0 end)::int as win_rounds,
                count(*)::int as total_rounds,
                max(rr.score)::int as best_score
         from public.round_results rr
         where rr.user_id = any($1::uuid[])
         group by rr.user_id
       ),
       peak_rank as (
         -- Lowest rr.rank value the user ever achieved (1 = best). Tie-broken by
         -- earliest occurrence so the date reflects when they first hit it.
         select distinct on (rr.user_id)
                rr.user_id,
                rr.rank as peak_rank,
                rr.created_at as peak_rank_at
           from public.round_results rr
          where rr.user_id = any($1::uuid[])
            and rr.rank is not null
            and rr.rank > 0
          order by rr.user_id, rr.rank asc, rr.created_at asc
       ),
       rating_7d as (
         select distinct on (rr.user_id) rr.user_id, rr.rating_after
         from public.round_results rr
         where rr.user_id = any($1::uuid[])
           and rr.created_at <= now() - interval '7 days'
         order by rr.user_id, rr.created_at desc
       )
       select u.id as user_id, u.handle, u.display_name, u.created_at,
              r.rating, r.peak_rating, r.games_played, r.rounds_played, r.last_played,
              r.rnk, r.total::int,
              s.win_rounds, s.total_rounds, s.best_score,
              pr.peak_rank, pr.peak_rank_at,
              r7.rating_after as rating_7d_ago
         from public.users u
         join ranked r on r.user_id = u.id
         left join summary s on s.user_id = u.id
         left join peak_rank pr on pr.user_id = u.id
         left join rating_7d r7 on r7.user_id = u.id
        where u.id = any($1::uuid[])`,
      [userIds],
    ),

    pool.query<TimelineRow>(
      `select rr.user_id, rr.created_at as ts, rr.rating_after as rating,
              rr.rating_delta as delta, g.room_code, rr.round_number
         from public.round_results rr
         join public.games g on g.id = rr.game_id
        where rr.user_id = any($1::uuid[])
          and rr.rating_after is not null
        order by rr.user_id, rr.created_at asc`,
      [userIds],
    ),

    pool.query<RecentGameRow>(
      `with per_game as (
         select rr.user_id, g.id as game_id, g.room_code, g.ended_at, g.started_at,
                g.total_rounds,
                sum(rr.score)::int as score_sum,
                sum(rr.rating_delta)::int as total_delta,
                (array_agg(rr.rank order by rr.round_number desc))[1] as final_rank,
                row_number() over (
                  partition by rr.user_id
                  order by coalesce(g.ended_at, g.started_at) desc
                ) as rn
         from public.games g
         join public.round_results rr on rr.game_id = g.id
        where rr.user_id = any($1::uuid[])
        group by rr.user_id, g.id
       )
       select user_id, game_id, room_code, ended_at, started_at, total_rounds,
              score_sum, total_delta, final_rank
         from per_game
        where rn <= 5
        order by user_id, coalesce(ended_at, started_at) desc`,
      [userIds],
    ),
  ]);

  // Build per-user buckets for timeline + recent games
  const timelineByUser = new Map<string, TimelinePoint[]>();
  for (const r of timelineQ.rows) {
    const arr = timelineByUser.get(r.user_id) ?? [];
    arr.push({
      ts: r.ts.toISOString(),
      rating: r.rating,
      delta: r.delta,
      roomCode: r.room_code,
      roundNumber: r.round_number,
    });
    timelineByUser.set(r.user_id, arr);
  }

  const recentByUser = new Map<string, RecentGame[]>();
  for (const r of recentQ.rows) {
    const arr = recentByUser.get(r.user_id) ?? [];
    arr.push({
      gameId: r.game_id,
      roomCode: r.room_code,
      endedAt: r.ended_at?.toISOString() ?? null,
      startedAt: r.started_at.toISOString(),
      totalRounds: r.total_rounds,
      finalRank: r.final_rank,
      scoreSum: r.score_sum,
      totalDelta: r.total_delta ?? 0,
    });
    recentByUser.set(r.user_id, arr);
  }

  const profiles = new Map<string, ProfileData>();
  for (const s of summaryQ.rows) {
    const winRate =
      s.total_rounds && s.total_rounds > 0
        ? Number(s.win_rounds ?? 0) / Number(s.total_rounds)
        : 0;
    const ratingDelta7d =
      s.rating_7d_ago != null ? s.rating - Number(s.rating_7d_ago) : null;

    const peakRank =
      s.peak_rank != null && s.peak_rank_at != null
        ? { rank: s.peak_rank, achievedAt: s.peak_rank_at.toISOString() }
        : null;

    profiles.set(s.handle, {
      handle: s.handle,
      displayName: s.display_name,
      memberSince: s.created_at.toISOString(),
      rank: s.rnk ?? null,
      totalRanked: s.total ?? 0,
      rating: s.rating,
      peakRating: s.peak_rating,
      gamesPlayed: s.games_played,
      roundsPlayed: s.rounds_played,
      lastPlayed: s.last_played?.toISOString() ?? null,
      ratingDelta7d,
      winRate,
      bestRoundScore: s.best_score ?? null,
      peakRank,
      timeline: timelineByUser.get(s.user_id) ?? [],
      recentGames: recentByUser.get(s.user_id) ?? [],
    });
  }

  return profiles;
}
