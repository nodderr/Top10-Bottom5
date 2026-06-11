'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/landing/Logo';
import { CreateRoomModal, JoinRoomModal } from '@/components/landing/RoomModals';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';

export default function LandingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { roomCode, roomState } = useRoom();
  const router = useRouter();

  useEffect(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-10 w-full max-w-sm">
        <Logo />

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => setShowCreate(true)}
            size="lg"
            className="w-full font-display tracking-widest"
          >
            CREATE ROOM
          </Button>
          <Button
            onClick={() => setShowJoin(true)}
            variant="secondary"
            size="lg"
            className="w-full font-display tracking-widest"
          >
            JOIN ROOM
          </Button>
        </div>

        <p className="text-[var(--text-muted)] text-xs text-center">
          No accounts. No downloads. Share the code.
        </p>
      </div>

      <CreateRoomModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinRoomModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </main>
  );
}
