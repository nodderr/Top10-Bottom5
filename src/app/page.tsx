'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Logo } from '@/components/landing/Logo';
import { CreateRoomModal, JoinRoomModal } from '@/components/landing/RoomModals';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';

export default function LandingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { roomCode, roomState } = useRoom();
  const router = useRouter();

  // Auto-redirect when room is created or joined
  useEffect(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  return (
    <main className="relative min-h-screen bg-[var(--bg)] bg-grid flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFD54A 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF5A5A 0%, transparent 70%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-4 py-12 w-full max-w-lg">
        {/* Logo */}
        <Logo />

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Button
            onClick={() => setShowCreate(true)}
            size="xl"
            className="w-full font-display tracking-widest"
          >
            ✦ CREATE ROOM
          </Button>
          <Button
            onClick={() => setShowJoin(true)}
            variant="secondary"
            size="xl"
            className="w-full font-display tracking-widest"
          >
            JOIN ROOM
          </Button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          {['🎮 Multiplayer', '🤖 AI Rankings', '⚡ Real-time', '🇮🇳 Made for India'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-xs text-[var(--text-muted)] text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          No accounts. No downloads. Just share the code.
        </motion.p>
      </div>

      {/* Modals */}
      <CreateRoomModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinRoomModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </main>
  );
}
