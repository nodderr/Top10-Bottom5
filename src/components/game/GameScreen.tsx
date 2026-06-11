'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { AnswerBoard } from './AnswerBoard';
import { Timer } from './Timer';
import { GuessInput } from './GuessInput';
import { Leaderboard } from './Leaderboard';
import { ToastContainer } from '@/components/ui';

export function GameScreen() {
  const { roundState, roomState, myId, submitGuess, toasts } = useRoom();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastRevealedRank, setLastRevealedRank] = useState<number | null>(null);

  if (!roundState || !roomState) return null;

  const { category, roundNumber, totalRounds, timerSeconds, revealed } = roundState;
  const isPlaying = roomState.state === 'playing';
  const foundCount = revealed.length;

  const handleGuess = (guess: string) => {
    const prevCount = revealed.length;
    submitGuess(guess);
    // Detect newly revealed answer on next render cycle
    setTimeout(() => {
      if (revealed.length > prevCount) {
        setLastRevealedRank(revealed[revealed.length - 1]?.rank ?? null);
        setTimeout(() => setLastRevealedRank(null), 1000);
      }
    }, 100);
  };

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-4 bg-[var(--surface)]">
          <span className="text-xs font-bold text-[var(--text-muted)] flex-shrink-0 uppercase tracking-widest">
            {roundNumber}/{totalRounds}
          </span>
          <div className="w-px h-4 bg-[var(--border)] flex-shrink-0" />
          <h2 className="flex-1 font-display font-bold text-sm text-[var(--text)] leading-snug line-clamp-2">
            {category}
          </h2>
          <Timer seconds={timerSeconds} />
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Answer board */}
          <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]">
                <div
                  className="h-px bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${(foundCount / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--text-muted)] flex-shrink-0">
                {foundCount}/10
              </span>
            </div>

            <AnswerBoard
              revealed={revealed}
              newlyRevealedRank={lastRevealedRank}
            />
          </main>

          {/* Desktop leaderboard */}
          <aside className="hidden lg:flex flex-col w-56 border-l border-[var(--border)] p-4 gap-3 overflow-y-auto">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Scores
            </p>
            <Leaderboard players={roomState.players} scores={roomState.scores ?? {}} myId={myId} />
          </aside>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-2">
          <GuessInput onGuess={handleGuess} disabled={!isPlaying} />
          <button
            onClick={() => setShowLeaderboard(true)}
            className="lg:hidden text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-1"
          >
            Scores ↑
          </button>
        </div>
      </div>

      {/* Mobile leaderboard drawer */}
      <AnimatePresence>
        {showLeaderboard && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
            />
            <motion.div
              className="drawer lg:hidden p-4"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-sm text-[var(--text)]">Scores</p>
                <button onClick={() => setShowLeaderboard(false)} className="text-[var(--text-muted)] text-lg">×</button>
              </div>
              <Leaderboard players={roomState.players} scores={roomState.scores ?? {}} myId={myId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
