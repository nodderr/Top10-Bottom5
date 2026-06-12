'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';
import { Confetti } from '@/components/ui/Confetti';

export function GameEndScreen() {
  const { gameEndState, roomState, myId, isHost, playAgain } = useRoom();
  const router = useRouter();

  if (!gameEndState || !roomState) return null;

  const { scores, players, winnerName } = gameEndState;

  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <Confetti count={60} spread={420} duration={2.8} />

      <span className="hidden md:block absolute top-12 left-12 w-2 h-2 bg-[var(--blue)]" />
      <span className="hidden md:block absolute top-12 right-12 w-2 h-2 bg-[var(--red)]" />
      <span className="hidden md:block absolute bottom-12 left-12 w-2 h-2 bg-[var(--yellow)]" />
      <span className="hidden md:block absolute bottom-12 right-12 w-2 h-2 bg-[var(--green)]" />

      <div className="w-full max-w-sm flex flex-col gap-7 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="text-[11px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">
            Game Over
          </p>
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.1, type: 'spring', damping: 14 }}
            className="text-6xl mb-2"
          >
            🏆
          </motion.p>
          <h1 className="font-display font-extrabold text-3xl text-[var(--blue)] leading-tight">
            {winnerName ?? 'No winner'}
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5">
            {winnerName ? 'wins the game!' : 'No one scored this game.'}
          </p>
        </motion.div>

        <div className="h-px bg-[var(--border)]" />

        <div>
          <p className="text-[11px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] mb-3">
            Final Scores
          </p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex flex-col gap-3">
          {isHost && (
            <Button onClick={playAgain} size="lg" className="w-full tracking-[0.22em] py-3.5">
              PLAY AGAIN
            </Button>
          )}
          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            size="lg"
            className="w-full tracking-[0.22em] py-3.5"
          >
            HOME
          </Button>
          {!isHost && (
            <p className="text-center text-xs font-medium text-[var(--text-muted)] mt-1">
              Waiting for host to restart…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
