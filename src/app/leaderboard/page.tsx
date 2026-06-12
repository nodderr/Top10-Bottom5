import Link from 'next/link';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { LeaderboardEntry } from './LeaderboardList';
import { LeaderboardClient } from './LeaderboardClient';
import { loadProfilesByHandle, ProfileData } from '@/lib/profile-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard — Top 10 Bottom 5' };

interface Row {
  id: string;
  handle: string;
  display_name: string;
  rating: number;
  peak_rating: number;
  games_played: number;
  rounds_played: number;
  last_played: Date | null;
  created_at: Date;
}

async function loadEntriesAndIds(): Promise<{
  entries: LeaderboardEntry[];
  userIds: string[];
}> {
  const { rows } = await pool.query<Row>(
    `select
       u.id, u.handle, u.display_name,
       er.rating, er.peak_rating,
       er.games_played, er.rounds_played,
       er.last_played, u.created_at
     from public.users u
     join public.elo_ratings er on er.user_id = u.id
     order by er.rating desc, er.peak_rating desc, u.created_at asc
     limit 100`,
  );
  return {
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
    userIds: rows.map((r) => r.id),
  };
}

export default async function LeaderboardPage() {
  const [{ entries, userIds }, viewer] = await Promise.all([
    loadEntriesAndIds(),
    getCurrentUser(),
  ]);

  // Prefetch every leaderboard user's profile in a single batched query bundle
  // (3 SQL queries total, not 100). Clicking a row is then instant.
  const profilesMap = await loadProfilesByHandle(userIds);
  const profilesByHandle: Record<string, ProfileData> = {};
  for (const [handle, p] of profilesMap) profilesByHandle[handle] = p;

  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40 py-10 md:py-12">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="self-start text-[11px] font-display font-bold text-[var(--text-muted)] hover:text-[var(--text)] uppercase tracking-[0.22em]"
          >
            ← Home
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-display font-bold text-[var(--blue)] uppercase tracking-[0.3em] mb-1">
                Global rankings
              </p>
              <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-[var(--text)]">
                Leaderboard
              </h1>
            </div>
            <div className="hidden md:flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-[var(--blue)]" />
              <span className="w-2.5 h-2.5 bg-[var(--red)]" />
              <span className="w-2.5 h-2.5 bg-[var(--yellow)]" />
              <span className="w-2.5 h-2.5 bg-[var(--green)]" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Top players by FFA ELO. Click a row to see their rating timeline.
          </p>
        </header>

        {entries.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 px-6 text-center">
            <p className="text-4xl mb-3">🏁</p>
            <p className="font-display font-extrabold text-xl text-[var(--text)] mb-1">
              No ranked players yet
            </p>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Be the first — sign up and play a round to claim rank #1.
            </p>
          </div>
        ) : (
          <LeaderboardClient
            entries={entries}
            viewerHandle={viewer?.handle ?? null}
            profilesByHandle={profilesByHandle}
          />
        )}
      </div>
    </main>
  );
}
