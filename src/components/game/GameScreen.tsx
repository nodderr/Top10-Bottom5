'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    submitGuess(guess);
  };

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        {/* ---- TOP HEADER ---- */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 flex items-center gap-3">
          {/* Round badge */}
          <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[rgba(255,213,74,0.1)] border border-[rgba(255,213,74,0.2)]">
            <p className="font-display font-800 text-xs text-[var(--primary)] tracking-wider">
              ROUND {roundNumber}/{totalRounds}
            </p>
          </div>

          {/* Category */}
          <h2 className="flex-1 font-display font-800 text-sm text-[var(--text)] leading-tight line-clamp-2">
            {category}
          </h2>

          {/* Timer */}
          <div className="flex-shrink-0">
            <Timer seconds={timerSeconds} />
          </div>
        </div>

        {/* ---- MAIN LAYOUT ---- */}
        <div className="flex flex-1 overflow-hidden">
          {/* ---- CENTER — Answer Board ---- */}
          <main className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-card)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${(foundCount / 10) * 100}%` }}
                  transition={{ duration: 0.4 }}
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

          {/* ---- RIGHT SIDEBAR — Desktop Leaderboard ---- */}
          <aside className="hidden lg:flex flex-col w-64 border-l border-[var(--border)] p-4 gap-3 overflow-y-auto">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Leaderboard
            </p>
            <Leaderboard
              players={roomState.players}
              scores={roomState.scores ?? {}}
              myId={myId}
            />
          </aside>
        </div>

        {/* ---- BOTTOM — Guess Input ---- */}
        <div className="border-t border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-3">
          <GuessInput onGuess={handleGuess} disabled={!isPlaying} />

          {/* Mobile leaderboard toggle */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="lg:hidden w-full py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            👥 Show Leaderboard
          </button>
        </div>
      </div>

      {/* ---- Mobile Leaderboard Drawer ---- */}
      <AnimatePresence>
        {showLeaderboard && (
          <>
            <motion.div
              className="drawer-overlay lg:hidden"
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-[var(--text)]">Leaderboard</h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-card-elevated)]"
                >
                  ×
                </button>
              </div>
              <Leaderboard
                players={roomState.players}
                scores={roomState.scores ?? {}}
                myId={myId}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
