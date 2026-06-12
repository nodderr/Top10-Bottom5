'use client';

import { useEffect, useMemo, useState } from 'react';
import { RatingChart, TimelinePoint } from './RatingChart';

interface RecentGame {
  gameId: string;
  roomCode: string;
  endedAt: string | null;
  startedAt: string;
  totalRounds: number;
  finalRank: number;
  scoreSum: number;
  totalDelta: number;
}

interface ProfileData {
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
  avgDeltaPerRound: number | null;
  range: '7d' | '30d' | 'all';
  timeline: TimelinePoint[];
  recentGames: RecentGame[];
}

type Range = '7d' | '30d' | 'all';

const PALETTE = ['#1A73E8', '#EA4335', '#FBBC05', '#34A853'];
function colorFor(seed: string) {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum = (sum + seed.charCodeAt(i)) % 999983;
  return PALETTE[sum % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(iso);
}

interface Props {
  handle: string;
}

type FetchState =
  | { status: 'loading'; key: string }
  | { status: 'ok'; key: string; data: ProfileData }
  | { status: 'error'; key: string; error: string };

export function UserProfilePanel({ handle }: Props) {
  const [range, setRange] = useState<Range>('all');
  const key = `${handle}|${range}`;
  const [state, setState] = useState<FetchState>({ status: 'loading', key });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/u/${encodeURIComponent(handle)}?range=${range}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(r.status === 404 ? 'User not found' : 'Failed to load');
        }
        return (await r.json()) as ProfileData;
      })
      .then((d) => {
        if (!cancelled) setState({ status: 'ok', key, data: d });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ status: 'error', key, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [handle, range, key]);

  const avatarColor = useMemo(() => colorFor(handle), [handle]);

  // Treat "previous-key" state as loading so the panel doesn't briefly show
  // stale data while a new fetch is in flight.
  if (state.key !== key || state.status === 'loading') {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface)] h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] py-12 px-6 text-center">
        <p className="text-3xl mb-2">🤷</p>
        <p className="font-display font-bold text-[var(--text-muted)]">{state.error}</p>
      </div>
    );
  }

  const data = state.data;

  return (
    <div className="flex flex-col gap-5">
      {/* HEADER STRIP */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 flex items-center justify-center text-sm font-display font-extrabold text-white shrink-0"
          style={{ background: avatarColor }}
        >
          {initials(data.displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold text-xl text-[var(--text)] truncate leading-tight">
            {data.displayName}
          </p>
          <p className="text-xs font-medium text-[var(--text-muted)] truncate">@{data.handle}</p>
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
            {data.rank ? `Rank #${data.rank} of ${data.totalRanked}` : 'Unranked'}
            <span className="mx-1.5 opacity-40">·</span>
            Since {shortDate(data.memberSince)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-extrabold text-3xl text-[var(--blue)] tabular leading-none">
            {data.rating ?? '—'}
          </p>
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] mt-1">
            ELO
          </p>
          {data.ratingDelta7d !== null && data.ratingDelta7d !== 0 && (
            <p
              className={`text-[11px] font-display font-extrabold mt-1 ${
                data.ratingDelta7d > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}
            >
              {data.ratingDelta7d > 0 ? '↑ +' : '↓ '}
              {data.ratingDelta7d} <span className="opacity-60 font-medium">7d</span>
            </p>
          )}
        </div>
      </div>

      {/* CHART */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-display font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Rating timeline
          </p>
          <div className="flex gap-1">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-[10px] font-display font-extrabold uppercase tracking-[0.18em] border transition-colors ${
                  range === r
                    ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                }`}
              >
                {r === 'all' ? 'ALL' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <RatingChart points={data.timeline} />
      </div>

      {/* STAT GRID */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-[11px] font-display font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-3">
          Stats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
          <Stat label="Peak ELO" value={data.peakRating?.toLocaleString() ?? '—'} accent="var(--yellow)" />
          <Stat
            label="Win rate"
            value={`${Math.round(data.winRate * 100)}%`}
            sub={`${data.roundsPlayed} rounds`}
            accent="var(--green)"
          />
          <Stat
            label="Best round"
            value={data.bestRoundScore?.toLocaleString() ?? '—'}
            sub="points in 1 round"
            accent="var(--red)"
          />
          <Stat label="Games" value={data.gamesPlayed.toLocaleString()} accent="var(--blue)" />
          <Stat label="Rounds" value={data.roundsPlayed.toLocaleString()} accent="var(--blue)" />
          <Stat
            label="Avg Δ / round"
            value={
              data.avgDeltaPerRound !== null
                ? (data.avgDeltaPerRound > 0 ? '+' : '') + data.avgDeltaPerRound.toFixed(1)
                : '—'
            }
            accent={
              data.avgDeltaPerRound === null
                ? 'var(--text-muted)'
                : data.avgDeltaPerRound >= 0
                ? 'var(--success)'
                : 'var(--danger)'
            }
          />
        </div>
        <p className="text-[11px] font-medium text-[var(--text-muted)] mt-4 pt-3 border-t border-[var(--border)]">
          Last played:{' '}
          <span className="text-[var(--text)] font-display font-bold">
            {relativeDate(data.lastPlayed)}
          </span>
        </p>
      </div>

      {/* RECENT GAMES */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-[11px] font-display font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-3">
          Recent games
        </p>
        {data.recentGames.length === 0 ? (
          <p className="text-sm font-medium text-[var(--text-muted)] py-4 text-center">
            No games played yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {data.recentGames.map((g) => {
              const deltaColor =
                g.totalDelta > 0
                  ? 'text-[var(--success)]'
                  : g.totalDelta < 0
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--text-muted)]';
              return (
                <li key={g.gameId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-sm text-[var(--text)]">
                      {shortDate(g.endedAt ?? g.startedAt)}
                      <span className={`ml-2 ${deltaColor} tabular`}>
                        {g.totalDelta > 0 ? '+' : ''}
                        {g.totalDelta} ELO
                      </span>
                    </p>
                    <p className="text-[11px] font-medium text-[var(--text-muted)] truncate">
                      {g.totalRounds} round{g.totalRounds === 1 ? '' : 's'} · finished #{g.finalRank} · Room{' '}
                      {g.roomCode}
                    </p>
                  </div>
                  <p className="text-xs font-display font-bold text-[var(--text-muted)] tabular shrink-0 ml-3">
                    {g.scoreSum.toLocaleString()} pts
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-display font-bold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="font-display font-extrabold text-xl text-[var(--text)] tabular leading-none">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.16em]">
          {sub}
        </span>
      )}
    </div>
  );
}
