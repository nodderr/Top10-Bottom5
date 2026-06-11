'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  const code = (params?.code as string ?? '').toUpperCase();

  const {
    roomCode,
    roomState,
    gameState,
    toasts,
    connectionStatus,
  } = useRoom();

  // If we don't have a room state yet (e.g. page refresh), redirect home with code query param
  useEffect(() => {
    if (connectionStatus === 'connected' && !roomState && roomCode !== code) {
      // Give a grace period in case socket is still setting up
      const timer = setTimeout(() => {
        if (!roomState) router.push(`/?code=${code}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, roomState, roomCode, code, router]);

  // Connection loading state
  if (connectionStatus === 'connecting' || (!roomState && connectionStatus === 'connected')) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] font-display font-600">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-[var(--text)] font-display font-bold text-xl">Room not found</p>
          <p className="text-[var(--text-muted)] text-sm">The room may have ended or expired.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 px-6 py-3 rounded-none bg-[var(--primary)] text-white font-display font-bold text-sm hover:brightness-110 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      <AnimatePresence mode="wait">
        {gameState === 'waiting' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LobbyScreen />
          </motion.div>
        )}

        {gameState === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GeneratingScreen />
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen />
          </motion.div>
        )}

        {gameState === 'round_end' && (
          <motion.div
            key="round-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoundEndScreen />
          </motion.div>
        )}

        {gameState === 'game_end' && (
          <motion.div
            key="game-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameEndScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
