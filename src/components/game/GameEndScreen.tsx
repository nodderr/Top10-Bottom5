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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Winner */}
        <div className="text-center">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 font-sans">Game Over</p>
          <p className="text-5xl mb-3">🏆</p>
          <h1 className="font-sans font-black text-3xl text-[#1A73E8]">{winnerName}</h1>
          <p className="text-sm font-semibold text-[var(--text-muted)] mt-1.5">wins the game!</p>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Final scores */}
        <div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 font-sans">Final Scores</p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost && (
            <Button onClick={playAgain} size="lg" className="w-full font-sans tracking-wider py-3.5">
              PLAY AGAIN
            </Button>
          )}
          <Button onClick={() => router.push('/')} variant="secondary" size="lg" className="w-full font-sans tracking-wider py-3.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#202124]">
            HOME
          </Button>
          {!isHost && (
            <p className="text-center text-xs font-semibold text-[var(--text-muted)] mt-1">
              Waiting for host to restart...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
