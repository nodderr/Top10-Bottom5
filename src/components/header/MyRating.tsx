'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';

interface EloPayload {
  rating: number | null;
  peak?: number;
  gamesPlayed?: number;
}

export function MyRating() {
  const { user } = useAuth();
  const { on } = useSocket();
  const [rating, setRating] = useState<number | null>(null);

  // Initial fetch + refetch when the authed user changes.
  useEffect(() => {
    if (!user) {
      setRating(null);
      return;
    }
    let cancelled = false;
    fetch('/api/me/elo', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<EloPayload>) : null))
      .then((data) => {
        if (!cancelled && data && typeof data.rating === 'number') setRating(data.rating);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Live update from round_end broadcasts so the header reflects the latest
  // rating without an extra round-trip after a game.
  useEffect(() => {
    if (!user) return;
    return on<{ eloChanges?: Array<{ handle: string; newElo: number }> }>(
      'round_end',
      (payload) => {
        const mine = payload.eloChanges?.find((c) => c.handle === user.handle);
        if (mine) setRating(mine.newElo);
      },
    );
  }, [user, on]);

  if (!user || rating === null) return null;

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--border)] bg-[var(--surface)]"
      title="Your current ELO rating"
    >
      <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        ELO
      </span>
      <span className="font-display font-extrabold text-xs text-[var(--text)] tabular-nums">
        {rating}
      </span>
    </div>
  );
}
