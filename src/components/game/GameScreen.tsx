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

  // Get current player details for scaled stats
  const me = roomState.players.find((p) => p.id === myId);
  const totalScore = me ? me.score * 1000 : 0;
  const roundScore = me ? me.roundScore * 1000 : 0;

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="game-header flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#1A73E8] uppercase tracking-widest font-sans">
              CATEGORY
            </span>
            <div className="w-px h-4 bg-[var(--border)] hidden md:block" />
            <h2 className="font-sans font-bold text-lg md:text-xl text-[#202124] leading-snug">
              {category}
            </h2>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Timer seconds={timerSeconds} />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Answer board wrapper */}
          <main className="game-main flex flex-col items-center">
            <div className="w-full max-w-4xl flex flex-col gap-6">
              
              {/* 2-Column Answer Board */}
              <AnswerBoard
                revealed={revealed}
                newlyRevealedRank={lastRevealedRank}
              />

              {/* Google Feud Style Bottom Stats */}
              <div className="grid grid-cols-4 gap-4 text-center mt-6 py-4 border-t border-b border-[var(--border)]">
                <div className="flex flex-col">
                  <span className="text-[11px] md:text-xs font-bold text-[#4285F4] tracking-wider uppercase font-sans">
                    ROUND
                  </span>
                  <span className="text-2xl md:text-3xl font-extrabold text-[#4285F4] mt-1 font-sans">
                    {roundNumber}
                  </span>
                </div>
                <div className="flex flex-col border-l border-[var(--border)]">
                  <span className="text-[11px] md:text-xs font-bold text-[#EA4335] tracking-wider uppercase font-sans">
                    FOUND
                  </span>
                  <span className="text-2xl md:text-3xl font-extrabold text-[#EA4335] mt-1 font-sans">
                    {foundCount}/10
                  </span>
                </div>
                <div className="flex flex-col border-l border-[var(--border)]">
                  <span className="text-[11px] md:text-xs font-bold text-[#FBBC05] tracking-wider uppercase font-sans">
                    TOTAL SCORE
                  </span>
                  <span className="text-2xl md:text-3xl font-extrabold text-[#FBBC05] mt-1 font-sans">
                    {totalScore.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col border-l border-[var(--border)]">
                  <span className="text-[11px] md:text-xs font-bold text-[#34A853] tracking-wider uppercase font-sans">
                    THIS ROUND
                  </span>
                  <span className="text-2xl md:text-3xl font-extrabold text-[#34A853] mt-1 font-sans">
                    {roundScore.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          </main>

          {/* Desktop leaderboard */}
          <aside className="hidden lg:flex game-sidebar">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2 font-sans">
              ROOM LEADERBOARD
            </p>
            <Leaderboard players={roomState.players} scores={roomState.scores ?? {}} myId={myId} />
          </aside>
        </div>

        {/* Bottom Guess Input */}
        <div className="game-guess-container flex flex-col items-center">
          <div className="w-full max-w-4xl flex flex-col gap-2">
            <GuessInput onGuess={handleGuess} disabled={!isPlaying} />
            <button
              onClick={() => setShowLeaderboard(true)}
              className="lg:hidden text-xs text-[#1A73E8] hover:text-[#135ab7] transition-colors py-1 mt-1 font-bold"
            >
              Show Leaderboard ↑
            </button>
          </div>
        </div>
      </div>

      {/* Mobile leaderboard drawer */}
      <AnimatePresence>
        {showLeaderboard && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
            />
            <motion.div
              className="drawer lg:hidden p-5 bg-white"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-2">
                <p className="font-bold text-sm text-[#202124]">Scores</p>
                <button onClick={() => setShowLeaderboard(false)} className="text-[#5F6368] text-2xl font-light">×</button>
              </div>
              <Leaderboard players={roomState.players} scores={roomState.scores ?? {}} myId={myId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
