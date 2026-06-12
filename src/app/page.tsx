'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/landing/Logo';
import { CreateRoomModal, JoinRoomModal } from '@/components/landing/RoomModals';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams ? searchParams.get('code') || '' : '';

  // Open Join modal automatically if a code is present in the URL.
  // Deriving initial state from the param avoids the setShowJoin-in-effect lint trap.
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(Boolean(codeParam));
  const { roomCode, roomState } = useRoom();
  const router = useRouter();

  useEffect(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative corner dots */}
      <span className="hidden md:block absolute top-12 left-12 w-2 h-2 bg-[var(--blue)]" />
      <span className="hidden md:block absolute top-12 right-12 w-2 h-2 bg-[var(--red)]" />
      <span className="hidden md:block absolute bottom-12 left-12 w-2 h-2 bg-[var(--yellow)]" />
      <span className="hidden md:block absolute bottom-12 right-12 w-2 h-2 bg-[var(--green)]" />

      <div className="flex flex-col items-center gap-12 w-full max-w-sm relative z-10">
        <Logo />

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => setShowCreate(true)}
            size="lg"
            className="w-full tracking-[0.22em]"
          >
            CREATE ROOM
          </Button>
          <Button
            onClick={() => setShowJoin(true)}
            variant="secondary"
            size="lg"
            className="w-full tracking-[0.22em]"
          >
            JOIN ROOM
          </Button>
        </div>

      </div>

      <CreateRoomModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinRoomModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        prefillCode={codeParam}
      />
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
