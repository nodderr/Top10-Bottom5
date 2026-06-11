'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { MAX_NAME_LENGTH, DEFAULT_TOTAL_ROUNDS } from '@/lib/constants';

// ---- Create Room Modal ----
export function CreateRoomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(DEFAULT_TOTAL_ROUNDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { createRoom, roomCode, roomState } = useRoom();

  useEffect(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  const handle = () => {
    const t = name.trim();
    if (!t || t.length < 2) { setError('Enter at least 2 characters'); return; }
    setLoading(true);
    setError('');
    createRoom(t, rounds);
    setTimeout(() => setLoading(false), 6000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <div className="flex flex-col gap-4">
        <Input
          label="Your Name"
          placeholder="e.g. Arjun"
          value={name}
          onChange={(e) => { setName(e.target.value.slice(0, MAX_NAME_LENGTH)); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
          error={error}
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Rounds</label>
          <div className="flex gap-2">
            {[1, 2, 3, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRounds(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  rounds === r
                    ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]'
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handle} loading={loading} size="lg" className="w-full mt-1">
          CREATE ROOM
        </Button>
        <p className="text-center text-xs text-[var(--text-muted)]">
          You&apos;ll get a 6-letter code to share
        </p>
      </div>
    </Modal>
  );
}

// ---- Join Room Modal ----
export function JoinRoomModal({
  isOpen, onClose, prefillCode = '',
}: { isOpen: boolean; onClose: () => void; prefillCode?: string }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const router = useRouter();
  const { joinRoom, roomCode, roomState } = useRoom();

  useEffect(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  const handle = () => {
    const t = name.trim();
    const c = code.trim().toUpperCase();
    const e: typeof errors = {};
    if (!t || t.length < 2) e.name = 'Enter at least 2 characters';
    if (!c || c.length !== 6) e.code = 'Code must be 6 characters';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    joinRoom(c, t);
    setTimeout(() => setLoading(false), 6000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
      <div className="flex flex-col gap-4">
        <Input
          label="Room Code"
          placeholder="ABCD12"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
            setErrors((p) => ({ ...p, code: undefined }));
          }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
          error={errors.code}
          className="font-display font-bold text-2xl tracking-[0.25em] text-center"
          maxLength={6}
          autoFocus
        />
        <Input
          label="Your Name"
          placeholder="e.g. Priya"
          value={name}
          onChange={(e) => { setName(e.target.value.slice(0, MAX_NAME_LENGTH)); setErrors((p) => ({ ...p, name: undefined })); }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
          error={errors.name}
        />
        <Button onClick={handle} loading={loading} size="lg" className="w-full mt-1">
          JOIN ROOM
        </Button>
      </div>
    </Modal>
  );
}
