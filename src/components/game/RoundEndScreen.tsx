'use client';

import { useEffect, useState } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { AnswerBoard } from './AnswerBoard';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';

export function RoundEndScreen() {
  const { roundEndState, roundState, roomState, myId, isHost, nextRound } = useRoom();
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roundEndState) return;
    if (revealedCount < roundEndState.allAnswers.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 120);
      return () => clearTimeout(t);
    }
  }, [revealedCount, roundEndState]);

  if (!roundEndState || !roomState) return null;

  const { allAnswers, revealed, scores, players, roundWinnerName, roundNumber, isLastRound } = roundEndState;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-0.5">
          Round {roundNumber} — Complete
        </p>
        <h2 className="font-display font-bold text-base text-[var(--text)]">
          {roundEndState.category ?? roundState?.category}
        </h2>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Round winner */}
          {roundWinnerName && (
            <div className="border border-[var(--border)] rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">Round Winner</p>
                <p className="font-display font-black text-lg text-[var(--primary)]">{roundWinnerName}</p>
              </div>
            </div>
          )}

          {/* Full answer reveal */}
          <AnswerBoard revealed={revealed} allAnswers={allAnswers.slice(0, revealedCount)} />
        </main>

        {/* Desktop scores */}
        <aside className="hidden lg:flex flex-col w-56 border-l border-[var(--border)] p-4 gap-3 overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Scores</p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </aside>
      </div>

      {/* Mobile scores */}
      <div className="lg:hidden px-4 pt-3 pb-1 border-t border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Scores</p>
        <Leaderboard players={players} scores={scores} myId={myId} compact />
      </div>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
        {isHost ? (
          <Button onClick={() => { setLoading(true); nextRound(); }} loading={loading} size="lg" className="w-full font-display tracking-widest">
            {loading ? 'Generating...' : isLastRound ? 'FINAL SCORES →' : `NEXT ROUND (${roundNumber + 1}/${roomState.totalRounds})`}
          </Button>
        ) : (
          <p className="text-center text-sm text-[var(--text-muted)] py-1">
            Waiting for host...
          </p>
        )}
      </div>
    </div>
  );
}
