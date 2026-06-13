'use client';

import { motion } from 'framer-motion';

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  displayName: string;
  rating: number;
  peakRating: number;
  gamesPlayed: number;
  roundsPlayed: number;
  lastPlayed: string | null;
  memberSince: string;
}

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

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardList({
  entries,
  viewerHandle,
  selectedHandle,
  onSelect,
}: {
  entries: LeaderboardEntry[];
  viewerHandle?: string | null;
  selectedHandle: string | null;
  onSelect: (handle: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((e) => {
        const isViewer = viewerHandle === e.handle;
        const isSelected = selectedHandle === e.handle;
        const isPodium = e.rank <= 3;
        const color = colorFor(e.handle);
        return (
          <li key={e.handle}>
            <motion.button
              onClick={() => onSelect(e.handle)}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
              className={`w-full text-left bg-[var(--surface)] border ${
                isSelected
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/40 shadow-[var(--shadow-sm)]'
                  : isViewer
                  ? 'border-[var(--primary)]/50'
                  : isPodium
                  ? 'border-[var(--border-strong)]'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              } transition-colors cursor-pointer block focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--primary)]`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3">
                <div className="w-7 md:w-8 shrink-0 text-center">
                  {e.rank <= 3 ? (
                    <span className="text-lg md:text-xl">{MEDALS[e.rank - 1]}</span>
                  ) : (
                    <span className="font-display font-extrabold text-sm text-[var(--text-muted)] tabular">
                      #{e.rank}
                    </span>
                  )}
                </div>

                <div
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-display font-extrabold text-white shrink-0"
                  style={{ background: color }}
                >
                  {initials(e.displayName)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-sm md:text-base text-[var(--text)] truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{e.displayName}</span>
                    {isViewer && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-display font-extrabold uppercase tracking-[0.18em] bg-[var(--primary)] text-[var(--primary-text)]">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] truncate">
                    @{e.handle}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-extrabold text-base md:text-lg text-[var(--blue)] tabular leading-none">
                    {e.rating}
                  </p>
                  <p className="text-[9px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-0.5">
                    ELO
                  </p>
                </div>
              </div>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );
}
