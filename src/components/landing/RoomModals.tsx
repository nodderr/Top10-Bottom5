'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Input } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { MAX_NAME_LENGTH, DEFAULT_TOTAL_ROUNDS } from '@/lib/constants';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(DEFAULT_TOTAL_ROUNDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { createRoom, roomCode, roomState } = useRoom();

  // Watch for room creation
  useState(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  });

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your display name'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }

    setLoading(true);
    setError('');
    createRoom(trimmed, rounds);

    // Navigate after short delay for socket to respond
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <div className="flex flex-col gap-4">
        <Input
          label="Your Name"
          placeholder="e.g. Arjun"
          value={name}
          onChange={(e) => { setName(e.target.value.slice(0, MAX_NAME_LENGTH)); setError(''); }}
          onKeyDown={handleKeyDown}
          error={error}
          autoFocus
          maxLength={MAX_NAME_LENGTH}
        />

        {/* Rounds selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">
            Rounds
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRounds(r)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                  rounds === r
                    ? 'bg-[var(--primary)] text-[#0F1115] border-[var(--primary)]'
                    : 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleCreate}
          loading={loading}
          size="lg"
          className="w-full mt-2"
        >
          CREATE ROOM
        </Button>

        <p className="text-center text-xs text-[var(--text-muted)]">
          You&apos;ll get a 6-character room code to share with friends
        </p>
      </div>
    </Modal>
  );
}

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCode?: string;
}

export function JoinRoomModal({ isOpen, onClose, prefillCode = '' }: JoinRoomModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const router = useRouter();
  const { joinRoom, roomCode, roomState } = useRoom();

  useState(() => {
    if (roomCode && roomState?.state === 'waiting') {
      router.push(`/room/${roomCode}`);
    }
  });

  const handleJoin = () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const newErrors: typeof errors = {};

    if (!trimmedName) newErrors.name = 'Please enter your display name';
    else if (trimmedName.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!trimmedCode) newErrors.code = 'Please enter the room code';
    else if (trimmedCode.length !== 6) newErrors.code = 'Room code must be 6 characters';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});
    joinRoom(trimmedCode, trimmedName);

    setTimeout(() => setLoading(false), 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
      <div className="flex flex-col gap-4">
        <Input
          label="Room Code"
          placeholder="e.g. ABCD12"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
            setErrors((prev) => ({ ...prev, code: undefined }));
          }}
          onKeyDown={handleKeyDown}
          error={errors.code}
          className="font-display font-bold text-xl tracking-widest text-center"
          maxLength={6}
        />

        <Input
          label="Your Name"
          placeholder="e.g. Priya"
          value={name}
          onChange={(e) => { setName(e.target.value.slice(0, MAX_NAME_LENGTH)); setErrors((prev) => ({ ...prev, name: undefined })); }}
          onKeyDown={handleKeyDown}
          error={errors.name}
          maxLength={MAX_NAME_LENGTH}
        />

        <Button
          onClick={handleJoin}
          loading={loading}
          size="lg"
          className="w-full mt-2"
        >
          JOIN ROOM
        </Button>
      </div>
    </Modal>
  );
}
