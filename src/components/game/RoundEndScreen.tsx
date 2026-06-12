'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { AnswerBoard } from './AnswerBoard';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';
import { Confetti } from '@/components/ui/Confetti';

export function RoundEndScreen() {
  const { roundEndState, roundState, roomState, myId, isHost, nextRound, leaveRoom, latestRoundElo } = useRoom();
  const router = useRouter();
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  useEffect(() => {
    if (!roundEndState || !roundEndState.allAnswers) return;
    if (revealedCount < roundEndState.allAnswers.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 130);
      return () => clearTimeout(t);
    }
  }, [revealedCount, roundEndState]);

  if (!roundEndState || !roomState) return null;

  const {
    allAnswers = [],
    revealed = [],
    scores = {},
    players = [],
    roundWinnerName,
    roundNumber,
    isLastRound,
  } = roundEndState;

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)] flex flex-col relative">
      {roundWinnerName && <Confetti count={36} spread={300} duration={2.2} />}

      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 md:px-8 py-4 relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-display font-extrabold text-[var(--blue)] uppercase tracking-[0.22em] mb-0.5">
            Round {roundNumber} — Complete
          </p>
          <h2 className="font-display font-bold text-lg md:text-xl text-[var(--text)] truncate">
            {roundEndState.category ?? roundState?.category}
          </h2>
        </div>
        <button
          onClick={handleLeave}
          title="Leave room"
          className="shrink-0 text-[10px] font-display font-bold text-[var(--text-muted)] hover:text-[var(--danger)] uppercase tracking-[0.18em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--danger)] transition-colors"
        >
          Exit
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto px-5 md:px-10 py-6 md:py-10 flex flex-col items-center">
          <div className="w-full max-w-3xl flex flex-col gap-5">
            {roundWinnerName && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="border border-[var(--border)] px-5 py-4 flex items-center gap-3 bg-[var(--surface)] shadow-[var(--shadow-sm)]"
              >
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em]">
                    Round Winner
                  </p>
                  <p className="font-display font-extrabold text-xl text-[var(--success)] mt-0.5">
                    {roundWinnerName}
                  </p>
                </div>
              </motion.div>
            )}

            <AnswerBoard revealed={revealed} allAnswers={allAnswers.slice(0, revealedCount)} />
          </div>
        </main>

        <aside className="hidden lg:flex flex-col w-72 border-l border-[var(--border)] bg-[var(--surface)] p-6 gap-3 overflow-y-auto">
          <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] border-b border-[var(--border)] pb-2">
            Standings
          </p>
          <Leaderboard players={players} scores={scores} myId={myId} />

          {latestRoundElo.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] mb-2">
                ELO this round
              </p>
              <ul className="flex flex-col gap-1">
                {latestRoundElo.map((c) => (
                  <li
                    key={c.handle}
                    className="flex items-center justify-between text-xs font-medium"
                  >
                    <span className="text-[var(--text)] truncate">@{c.handle}</span>
                    <span
                      className={`font-display font-extrabold tabular ${
                        c.delta > 0
                          ? 'text-[var(--success)]'
                          : c.delta < 0
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {c.delta > 0 ? '+' : ''}
                      {c.delta} → {c.newElo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <div className="lg:hidden px-6 pt-4 pb-2 border-t border-[var(--border)] bg-[var(--surface)] relative z-10">
        <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] mb-2">
          Standings
        </p>
        <Leaderboard players={players} scores={scores} myId={myId} compact />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col items-center relative z-10">
        <div className="w-full max-w-3xl">
          {isHost ? (
            <Button
              onClick={() => {
                setLoading(true);
                nextRound();
              }}
              loading={loading}
              size="lg"
              className="w-full py-4 tracking-[0.22em]"
            >
              {loading
                ? 'Generating…'
                : isLastRound
                ? 'FINAL SCORES →'
                : `NEXT ROUND (${roundNumber + 1}/${roomState.totalRounds})`}
            </Button>
          ) : (
            <p className="text-center text-sm font-medium text-[var(--text-muted)] py-2">
              Waiting for host to advance the game…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
