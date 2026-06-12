'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { LobbyScreen } from '@/components/lobby/LobbyScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { RoundEndScreen } from '@/components/game/RoundEndScreen';
import { GameEndScreen } from '@/components/game/GameEndScreen';
import { GeneratingScreen } from '@/components/game/GeneratingScreen';
import { ToastContainer } from '@/components/ui';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params?.code as string) ?? '').toUpperCase();

  const { roomCode, roomState, gameState, toasts, connectionStatus } = useRoom();

  useEffect(() => {
    if (connectionStatus === 'connected' && !roomState && roomCode !== code) {
      const timer = setTimeout(() => {
        if (!roomState) router.push(`/?code=${code}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, roomState, roomCode, code, router]);

  if (connectionStatus === 'connecting' || (!roomState && connectionStatus === 'connected')) {
    return (
      <div className="min-h-screen bg-[var(--bg)] bg-dotgrid flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] font-display font-semibold uppercase tracking-[0.18em] text-xs">
            Connecting…
          </p>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[var(--bg)] bg-dotgrid flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-[var(--text)] font-display font-bold text-xl">Room not found</p>
          <p className="text-[var(--text-muted)] text-sm">The room may have ended or expired.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 px-6 py-3 bg-[var(--primary)] text-white font-display font-bold text-sm tracking-[0.18em] hover:bg-[var(--primary-2)] transition-colors"
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  // Direct render — no AnimatePresence wrapper. Rapid state chains
  // (round_end → generating → playing) were leaving the wrapper motion.div
  // stuck at opacity 0 with mode="wait". Each screen has its own internal
  // mount animations so cross-screen transitions remain polished.
  return (
    <>
      <ToastContainer toasts={toasts} />
      {gameState === 'waiting' && <LobbyScreen />}
      {gameState === 'generating' && <GeneratingScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'round_end' && <RoundEndScreen />}
      {gameState === 'game_end' && <GameEndScreen />}
    </>
  );
}
