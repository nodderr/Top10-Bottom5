import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ rating: null });

  const { rows } = await pool.query<{
    rating: number;
    peak_rating: number;
    games_played: number;
    rounds_played: number;
  }>(
    `select rating, peak_rating, games_played, rounds_played
       from public.elo_ratings
      where user_id = $1`,
    [user.id],
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ rating: null });
  return NextResponse.json({
    rating: row.rating,
    peak: row.peak_rating,
    gamesPlayed: row.games_played,
    roundsPlayed: row.rounds_played,
  });
}
