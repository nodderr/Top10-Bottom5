import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Range = '7d' | '30d' | 'all';

function parseRange(value: string | null): Range {
  if (value === '7d' || value === '30d' || value === 'all') return value;
  return 'all';
}

function rangeClause(range: Range): string {
  if (range === '7d') return `and rr.created_at >= now() - interval '7 days'`;
  if (range === '30d') return `and rr.created_at >= now() - interval '30 days'`;
  return '';
}

interface UserRow {
  id: string;
  handle: string;
  display_name: string;
  created_at: Date;
}

interface RankRow {
  rank: number;
  total: number;
  rating: number;
  peak_rating: number;
  games_played: number;
  rounds_played: number;
  last_played: Date | null;
}

interface SummaryRow {
  win_rounds: number;
  total_rounds: number;
  best_score: number | null;
  peak_rank: number | null;
  peak_rank_at: Date | null;
  rating_7d_ago: number | null;
}

interface TimelineRow {
  ts: Date;
  rating: number;
  delta: number | null;
  room_code: string;
  round_number: number;
}

interface RecentGameRow {
  game_id: string;
  room_code: string;
  ended_at: Date | null;
  started_at: Date;
  total_rounds: number;
  final_rank: number;
  score_sum: number;
  total_delta: number | null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ handle: string }> },
) {
  const { handle } = await ctx.params;
  const normalized = handle.trim().toLowerCase();
  if (!normalized) return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });

  const range = parseRange(req.nextUrl.searchParams.get('range'));

  // 1. Resolve user
  const userQ = await pool.query<UserRow>(
    `select id, handle, display_name, created_at
       from public.users
      where handle = $1`,
    [normalized],
  );
  const user = userQ.rows[0];
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 2-5: parallel
  const [rankQ, summaryQ, timelineQ, recentGamesQ] = await Promise.all([
    pool.query<RankRow>(
      `with ranked as (
         select
           er.user_id,
           er.rating,
           er.peak_rating,
           er.games_played,
           er.rounds_played,
           er.last_played,
           rank() over (order by er.rating desc, er.peak_rating desc, u.created_at asc) as rnk,
           count(*) over () as total
         from public.elo_ratings er
         join public.users u on u.id = er.user_id
       )
       select rnk as rank, total::int, rating, peak_rating,
              games_played, rounds_played, last_played
         from ranked
        where user_id = $1`,
      [user.id],
    ),

    pool.query<SummaryRow>(
      `select
         coalesce(sum(case when rr.rank = 1 then 1 else 0 end), 0)::int as win_rounds,
         count(*)::int as total_rounds,
         max(rr.score)::int as best_score,
         (
           -- Lowest rank ever (1 = won the round). Tie-broken by earliest
           -- timestamp so the "achieved" date is the first time it happened.
           select rr2.rank
             from public.round_results rr2
            where rr2.user_id = $1
              and rr2.rank is not null
              and rr2.rank > 0
            order by rr2.rank asc, rr2.created_at asc
            limit 1
         ) as peak_rank,
         (
           select rr3.created_at
             from public.round_results rr3
            where rr3.user_id = $1
              and rr3.rank is not null
              and rr3.rank > 0
            order by rr3.rank asc, rr3.created_at asc
            limit 1
         ) as peak_rank_at,
         (
           select rr4.rating_after
             from public.round_results rr4
            where rr4.user_id = $1
              and rr4.created_at <= now() - interval '7 days'
            order by rr4.created_at desc
            limit 1
         ) as rating_7d_ago
       from public.round_results rr
      where rr.user_id = $1`,
      [user.id],
    ),

    pool.query<TimelineRow>(
      `select rr.created_at as ts,
              rr.rating_after as rating,
              rr.rating_delta as delta,
              g.room_code,
              rr.round_number
         from public.round_results rr
         join public.games g on g.id = rr.game_id
        where rr.user_id = $1
          and rr.rating_after is not null
          ${rangeClause(range)}
        order by rr.created_at asc
        limit 500`,
      [user.id],
    ),

    pool.query<RecentGameRow>(
      `with per_game as (
         select
           g.id as game_id,
           g.room_code,
           g.ended_at,
           g.started_at,
           g.total_rounds,
           sum(rr.score)::int as score_sum,
           sum(rr.rating_delta)::int as total_delta,
           (
             array_agg(rr.rank order by rr.round_number desc)
           )[1] as final_rank
         from public.games g
         join public.round_results rr on rr.game_id = g.id
        where rr.user_id = $1
        group by g.id
       )
       select * from per_game
       order by coalesce(ended_at, started_at) desc
       limit 5`,
      [user.id],
    ),
  ]);

  const rankRow = rankQ.rows[0];
  const summary = summaryQ.rows[0];

  const winRate =
    summary && summary.total_rounds > 0
      ? Number(summary.win_rounds) / Number(summary.total_rounds)
      : 0;

  const peakRank =
    summary?.peak_rank != null && summary.peak_rank_at != null
      ? { rank: summary.peak_rank, achievedAt: summary.peak_rank_at.toISOString() }
      : null;

  const ratingDelta7d =
    rankRow && summary?.rating_7d_ago != null
      ? rankRow.rating - Number(summary.rating_7d_ago)
      : null;

  return NextResponse.json({
    handle: user.handle,
    displayName: user.display_name,
    memberSince: user.created_at.toISOString(),
    rank: rankRow?.rank ?? null,
    totalRanked: rankRow?.total ?? 0,
    rating: rankRow?.rating ?? null,
    peakRating: rankRow?.peak_rating ?? null,
    gamesPlayed: rankRow?.games_played ?? 0,
    roundsPlayed: rankRow?.rounds_played ?? 0,
    lastPlayed: rankRow?.last_played?.toISOString() ?? null,
    ratingDelta7d,
    winRate,
    bestRoundScore: summary?.best_score ?? null,
    peakRank,
    range,
    timeline: timelineQ.rows.map((r) => ({
      ts: r.ts.toISOString(),
      rating: r.rating,
      delta: r.delta,
      roomCode: r.room_code,
      roundNumber: r.round_number,
    })),
    recentGames: recentGamesQ.rows.map((r) => ({
      gameId: r.game_id,
      roomCode: r.room_code,
      endedAt: r.ended_at?.toISOString() ?? null,
      startedAt: r.started_at.toISOString(),
      totalRounds: r.total_rounds,
      finalRank: r.final_rank,
      scoreSum: r.score_sum,
      totalDelta: r.total_delta ?? 0,
    })),
  });
}
