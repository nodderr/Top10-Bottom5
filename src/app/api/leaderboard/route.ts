import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface LeaderboardRow {
  handle: string;
  display_name: string;
  rating: number;
  peak_rating: number;
  games_played: number;
  rounds_played: number;
  last_played: Date | null;
  created_at: Date;
}

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = Math.max(1, Math.min(parseInt(limitParam ?? '100', 10) || 100, 500));

  // Pull everyone — even users with 0 games — so brand-new signups appear
  // in a low-traffic period. Sorting still surfaces active players first.
  const { rows } = await pool.query<LeaderboardRow>(
    `select
       u.handle,
       u.display_name,
       er.rating,
       er.peak_rating,
       er.games_played,
       er.rounds_played,
       er.last_played,
       u.created_at
     from public.users u
     join public.elo_ratings er on er.user_id = u.id
     order by er.rating desc, er.peak_rating desc, u.created_at asc
     limit $1`,
    [limit],
  );

  return NextResponse.json({
    entries: rows.map((r, i) => ({
      rank: i + 1,
      handle: r.handle,
      displayName: r.display_name,
      rating: r.rating,
      peakRating: r.peak_rating,
      gamesPlayed: r.games_played,
      roundsPlayed: r.rounds_played,
      lastPlayed: r.last_played?.toISOString() ?? null,
      memberSince: r.created_at.toISOString(),
    })),
  });
}
