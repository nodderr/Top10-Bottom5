'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { MAX_NAME_LENGTH, DEFAULT_TOTAL_ROUNDS } from '@/lib/constants';

// ---- Create Room Modal ----
export function CreateRoomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(DEFAULT_TOTAL_ROUNDS);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { createRoom, roomCode, roomState } = useRoom();

  useEffect(() => {
    setCustomPrompts((prev) => {
      const next = [...prev];
      if (next.length < rounds) {
        while (next.length < rounds) next.push('');
      } else if (next.length > rounds) {
        next.splice(rounds);
      }
      return next;
    });
  }, [rounds]);

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
    createRoom(t, rounds, isCustomMode ? customPrompts : undefined);
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
                className={`flex-1 py-2 rounded-none text-sm font-bold border transition-colors ${
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Category Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-2 text-sm font-bold border rounded-none transition-colors ${
                !isCustomMode
                  ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              Random AI
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-2 text-sm font-bold border rounded-none transition-colors ${
                isCustomMode
                  ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              Custom Prompt
            </button>
          </div>
        </div>

        {isCustomMode && (
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto border border-[var(--border)] p-3 bg-[var(--surface-2)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Round Prompts</p>
            {Array.from({ length: rounds }).map((_, idx) => (
              <Input
                key={idx}
                label={`Round ${idx + 1} Prompt`}
                placeholder="e.g. Top 10 Indian Web Series"
                value={customPrompts[idx] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPrompts((prev) => {
                    const next = [...prev];
                    next[idx] = val;
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}

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
  // Track that THIS modal just submitted a join — otherwise stale roomState
  // from a previous session could fire the redirect on mount.
  const justSubmitted = useRef(false);

  useEffect(() => {
    if (justSubmitted.current && roomCode && roomState) {
      justSubmitted.current = false;
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState, router]);

  const handle = () => {
    const t = name.trim();
    const c = code.trim().toUpperCase();
    const e: typeof errors = {};
    if (!t || t.length < 2) e.name = 'Enter at least 2 characters';
    if (!c || c.length !== 6) e.code = 'Code must be 6 characters';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    justSubmitted.current = true;
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
