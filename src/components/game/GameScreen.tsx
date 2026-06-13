'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { AnswerBoard } from './AnswerBoard';
import { Timer } from './Timer';
import { GuessInput } from './GuessInput';
import { Leaderboard } from './Leaderboard';
import { GameChat } from './GameChat';
import { ToastContainer } from '@/components/ui';

export function GameScreen() {
  const { roundState, roomState, myId, submitGuess, toasts, chatMessages, leaveRoom } = useRoom();
  const router = useRouter();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleLeave = () => {
    if (window.confirm('Leave the room? You will lose your score.')) {
      leaveRoom();
      router.push('/');
    }
  };
  const [lastRevealedRank, setLastRevealedRank] = useState<number | null>(null);
  const prevRevealedCount = useRef(0);
  const revealedLen = roundState?.revealed.length ?? 0;

  useEffect(() => {
    if (revealedLen > prevRevealedCount.current && roundState) {
      const newest = roundState.revealed[revealedLen - 1];
      if (newest) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastRevealedRank(newest.rank);
        const t = setTimeout(() => setLastRevealedRank(null), 1100);
        prevRevealedCount.current = revealedLen;
        return () => clearTimeout(t);
      }
    }
    prevRevealedCount.current = revealedLen;
    // roundState intentionally omitted — react to length only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedLen]);

  if (!roundState || !roomState) return null;

  const { category, roundNumber, timerSeconds, revealed } = roundState;
  const isPlaying = roomState.state === 'playing';
  const foundCount = revealed.length;

  const handleGuess = (guess: string) => submitGuess(guess);

  const me = roomState.players.find((p) => p.id === myId);
  const totalScore = me?.score ?? 0;
  const roundScore = me?.roundScore ?? 0;

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="h-screen overflow-hidden bg-[var(--bg)] flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 md:px-8 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] font-display font-extrabold text-[var(--blue)] uppercase tracking-[0.22em] shrink-0">
              Category
            </span>
            <span className="hidden md:block w-px h-4 bg-[var(--border)]" />
            <h2 className="font-display font-bold text-base md:text-lg text-[var(--text)] leading-snug truncate">
              {category}
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.18em] hidden sm:block">
              Round {roundNumber}
            </span>
            <Timer seconds={timerSeconds} totalSeconds={roomState.timerSeconds ?? 90} />
            <button
              onClick={handleLeave}
              title="Leave room"
              className="text-[10px] font-display font-bold text-[var(--text-muted)] hover:text-[var(--danger)] uppercase tracking-[0.18em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--danger)] transition-colors hidden md:block"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto px-5 md:px-8 py-6 md:py-8 flex flex-col items-center">
            <div className="w-full max-w-4xl flex flex-col gap-6">
              <AnswerBoard revealed={revealed} newlyRevealedRank={lastRevealedRank} />

              {/* Stats strip — four colored stats, kept clean */}
              <div className="grid grid-cols-4 gap-2 md:gap-4 text-center mt-2 py-4 border-t border-b border-[var(--border)]">
                <Stat color="var(--blue)" label="Round" value={roundNumber} />
                <Stat color="var(--red)" label="Found" value={`${foundCount}/10`} />
                <Stat color="var(--yellow)" label="Total" value={totalScore.toLocaleString()} />
                <Stat color="var(--green)" label="Round Score" value={roundScore.toLocaleString()} />
              </div>
            </div>
          </main>

          {/* Desktop sidebar */}
          <aside className="hidden lg:flex flex-col w-[300px] border-l border-[var(--border)] bg-[var(--surface)] px-6 py-7 gap-5 overflow-hidden">
            <div className="flex flex-col gap-2.5 min-h-0" style={{ maxHeight: '50%' }}>
              <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] border-b border-[var(--border)] pb-2">
                Leaderboard
              </p>
              <div className="overflow-y-auto pr-1">
                <Leaderboard
                  players={roomState.players}
                  scores={roomState.scores ?? {}}
                  myId={myId}
                />
              </div>
            </div>

            <div className="flex flex-col flex-1 border-t border-[var(--border)] pt-4 gap-2.5 overflow-hidden min-h-0">
              <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] border-b border-[var(--border)] pb-2">
                Live Feed
              </p>
              <GameChat chatMessages={chatMessages} />
            </div>
          </aside>
        </div>

        {/* Footer / Guess Input */}
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-5 md:px-8 py-4 flex flex-col items-center">
          <div className="w-full max-w-4xl flex flex-col gap-2">
            <GuessInput onGuess={handleGuess} disabled={!isPlaying} />
            <button
              onClick={() => setShowLeaderboard(true)}
              className="lg:hidden text-[11px] text-[var(--primary)] hover:text-[var(--primary-2)] transition-colors py-1 mt-1 font-display font-bold uppercase tracking-[0.18em]"
            >
              Scores & Live Feed ↑
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {showLeaderboard && (
          <>
            <motion.div
              className="fixed inset-0 bg-[var(--overlay)] z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
            />
            <motion.div
              className="drawer lg:hidden p-5"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-2.5">
                <p className="font-display font-bold text-sm text-[var(--text)] uppercase tracking-[0.18em]">
                  Scores & Live Feed
                </p>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-2xl font-light w-8 h-8 flex items-center justify-center leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <Leaderboard players={roomState.players} scores={roomState.scores ?? {}} myId={myId} />
                <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2 min-h-[160px]">
                  <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em]">
                    Live Feed
                  </p>
                  <GameChat chatMessages={chatMessages} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Stat({ color, label, value }: { color: string; label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span
        className="text-[10px] md:text-[11px] font-display font-extrabold tracking-[0.18em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <span
        className="text-xl md:text-3xl font-display font-extrabold mt-1 tabular leading-none"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
