'use client';

import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';

export function GameEndScreen() {
  const { gameEndState, roomState, myId, isHost, playAgain } = useRoom();
  const router = useRouter();

  if (!gameEndState || !roomState) return null;

  const { scores, players, winnerName } = gameEndState;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Winner */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-1">Game Over</p>
          <p className="text-4xl mb-2">🏆</p>
          <h1 className="font-display font-black text-3xl text-[var(--primary)]">{winnerName}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">wins the game</p>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Final scores */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Final Scores</p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost && (
            <Button onClick={playAgain} size="lg" className="w-full font-display tracking-widest">
              PLAY AGAIN
            </Button>
          )}
          <Button onClick={() => router.push('/')} variant="secondary" size="lg" className="w-full font-display tracking-widest">
            HOME
          </Button>
          {!isHost && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              Waiting for host to restart...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
