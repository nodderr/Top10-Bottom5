'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { AnswerBoard } from './AnswerBoard';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';

export function RoundEndScreen() {
  const { roundEndState, roundState, roomState, myId, isHost, nextRound } = useRoom();
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sequentially reveal unfound answers
  useEffect(() => {
    if (!roundEndState) return;
    const unrevealedTotal = roundEndState.allAnswers.length;

    if (revealedCount < unrevealedTotal) {
      const timer = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, roundEndState]);

  if (!roundEndState || !roomState) return null;

  const { allAnswers, revealed, scores, players, roundWinnerName, roundNumber, isLastRound } = roundEndState;
  const partialAnswers = allAnswers.slice(0, revealedCount);

  const handleNext = () => {
    setLoading(true);
    nextRound();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-1">
            Round {roundNumber} Complete
          </p>
          <h2 className="font-display font-black text-2xl text-[var(--text)]">
            {roundEndState.category ?? roundState?.category}
          </h2>
        </motion.div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Board */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Round winner banner */}
          {roundWinnerName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl text-center border"
              style={{
                background: 'rgba(255,213,74,0.08)',
                borderColor: 'rgba(255,213,74,0.3)',
              }}
            >
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Round Winner</p>
              <p className="font-display font-black text-2xl text-[var(--primary)]">
                🏆 {roundWinnerName}
              </p>
            </motion.div>
          )}

          {/* Full board reveal */}
          <AnswerBoard
            revealed={revealed}
            allAnswers={partialAnswers}
          />
        </main>

        {/* Leaderboard sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-[var(--border)] p-4 gap-3 overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Scores
          </p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </aside>
      </div>

      {/* Mobile leaderboard */}
      <div className="lg:hidden px-4 pb-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 mt-4">Scores</p>
        <Leaderboard players={players} scores={scores} myId={myId} compact />
      </div>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-card)] p-4">
        {isHost ? (
          <Button
            onClick={handleNext}
            loading={loading}
            size="lg"
            className="w-full font-display tracking-widest"
          >
            {loading
              ? 'Generating Next Round...'
              : isLastRound
              ? '🏁 VIEW FINAL SCORES'
              : `▶ NEXT ROUND (${roundNumber + 1}/${roundEndState.totalRounds ?? roomState.totalRounds})`}
          </Button>
        ) : (
          <div className="text-center py-2">
            <p className="text-[var(--text-muted)] text-sm">Waiting for host to continue...</p>
            <div className="flex gap-1.5 justify-center mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--primary)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
