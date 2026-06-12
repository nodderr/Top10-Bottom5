'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function shortDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardList({
  entries,
  viewerHandle,
}: {
  entries: LeaderboardEntry[];
  viewerHandle?: string | null;
}) {
  const [openHandle, setOpenHandle] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => {
        const isOpen = openHandle === e.handle;
        const isPodium = e.rank <= 3;
        const isViewer = viewerHandle === e.handle;
        const color = colorFor(e.handle);
        return (
          <li key={e.handle}>
            <motion.button
              layout
              onClick={() => setOpenHandle(isOpen ? null : e.handle)}
              className={`w-full text-left bg-[var(--surface)] border ${
                isViewer
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/30'
                  : isPodium
                  ? 'border-[var(--border-strong)]'
                  : 'border-[var(--border)]'
              } ${isOpen ? 'shadow-[var(--shadow)]' : 'hover:shadow-[var(--shadow-sm)]'}
              transition-shadow cursor-pointer block focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--primary)]`}
              aria-expanded={isOpen}
              transition={{ layout: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
            >
              <motion.div layout className="flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4">
                <div className="w-9 md:w-11 shrink-0 text-center">
                  {e.rank <= 3 ? (
                    <span className="text-2xl md:text-3xl">{MEDALS[e.rank - 1]}</span>
                  ) : (
                    <span className="font-display font-extrabold text-lg text-[var(--text-muted)] tabular">
                      {e.rank}
                    </span>
                  )}
                </div>

                <div
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xs md:text-sm font-display font-extrabold text-white shrink-0"
                  style={{ background: color }}
                >
                  {initials(e.displayName)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-base md:text-lg text-[var(--text)] truncate leading-tight flex items-center gap-2">
                    <span className="truncate">{e.displayName}</span>
                    {isViewer && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[10px] font-display font-extrabold uppercase tracking-[0.18em] bg-[var(--primary)] text-[var(--primary-text)]">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-muted)] truncate">
                    @{e.handle}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-extrabold text-xl md:text-2xl text-[var(--blue)] tabular leading-none">
                    {e.rating}
                  </p>
                  <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">
                    ELO
                  </p>
                </div>
              </motion.div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-4 md:px-5 md:py-5 bg-[var(--surface-2)]">
                      <Stat
                        label="Peak ELO"
                        value={e.peakRating.toLocaleString()}
                        accent="var(--yellow)"
                      />
                      <Stat
                        label="Games"
                        value={e.gamesPlayed.toLocaleString()}
                        accent="var(--green)"
                      />
                      <Stat
                        label="Rounds"
                        value={e.roundsPlayed.toLocaleString()}
                        accent="var(--red)"
                      />
                      <Stat
                        label="Member since"
                        value={shortDate(e.memberSince)}
                        accent="var(--blue)"
                      />
                      <div className="col-span-2 md:col-span-4 text-[11px] font-medium text-[var(--text-muted)] pt-1 border-t border-[var(--border)] mt-1 flex flex-wrap justify-between gap-2">
                        <span>
                          Last played:{' '}
                          <span className="text-[var(--text)] font-display font-bold">
                            {shortDate(e.lastPlayed)}
                          </span>
                        </span>
                        <span className="opacity-60">Click again to collapse</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-display font-bold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="font-display font-extrabold text-lg text-[var(--text)] tabular leading-none">
        {value}
      </span>
    </div>
  );
}
