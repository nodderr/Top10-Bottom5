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
    if (!roundEndState || !roundEndState.allAnswers) return;
    if (revealedCount < roundEndState.allAnswers.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 120);
      return () => clearTimeout(t);
    }
  }, [revealedCount, roundEndState]);

  if (!roundEndState || !roomState) return null;

  const { allAnswers = [], revealed = [], scores = {}, players = [], roundWinnerName, roundNumber, isLastRound } = roundEndState;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[#F8F9FA] px-6 py-4">
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest font-sans mb-0.5">
          Round {roundNumber} — Complete
        </p>
        <h2 className="font-sans font-bold text-lg md:text-xl text-[#202124]">
          {roundEndState.category ?? roundState?.category}
        </h2>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-3xl flex flex-col gap-5">
            {/* Round winner */}
            {roundWinnerName && (
              <div className="border border-[var(--border)] rounded-none px-5 py-4 flex items-center gap-3 bg-[#F8F9FA]">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Round Winner</p>
                  <p className="font-sans font-black text-lg text-[#34A853] mt-0.5">{roundWinnerName}</p>
                </div>
              </div>
            )}

            {/* Full answer reveal */}
            <AnswerBoard revealed={revealed} allAnswers={allAnswers.slice(0, revealedCount)} />
          </div>
        </main>

        {/* Desktop scores */}
        <aside className="hidden lg:flex flex-col w-72 border-l border-[var(--border)] p-6 gap-4 overflow-y-auto bg-[#F8F9FA]">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2 font-sans">ROUND STANDINGS</p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </aside>
      </div>

      {/* Mobile scores */}
      <div className="lg:hidden px-6 pt-4 pb-2 border-t border-[var(--border)] bg-[#F8F9FA]">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 font-sans">STANDINGS</p>
        <Leaderboard players={players} scores={scores} myId={myId} compact />
      </div>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] bg-[#F8F9FA] p-5 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {isHost ? (
            <Button onClick={() => { setLoading(true); nextRound(); }} loading={loading} size="lg" className="w-full font-sans tracking-wider py-4 text-base">
              {loading ? 'Generating...' : isLastRound ? 'FINAL SCORES →' : `NEXT ROUND (${roundNumber + 1}/${roomState.totalRounds})`}
            </Button>
          ) : (
            <p className="text-center text-sm font-semibold text-[var(--text-muted)] py-2">
              Waiting for host to advance the game...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
