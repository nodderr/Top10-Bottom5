'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { MAX_NAME_LENGTH, DEFAULT_TOTAL_ROUNDS } from '@/lib/constants';

const ROUND_CHOICES = [1, 2, 3, 5] as const;
const TIMER_CHOICES = [30, 60, 90, 120] as const;
const DEFAULT_TIMER_SECONDS = 90;

// ---- Create Room Modal ----
export function CreateRoomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState<number>(DEFAULT_TOTAL_ROUNDS);
  const [timerSeconds, setTimerSeconds] = useState<number>(DEFAULT_TIMER_SECONDS);
  const [isCustomMode, setIsCustomMode] = useState(false);
  // Sparse array — index = round number; entries beyond `rounds` are preserved
  // in case the user shrinks then re-expands. No effect needed.
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { createRoom, roomCode, roomState } = useRoom();
  const justSubmitted = useRef(false);

  useEffect(() => {
    if (justSubmitted.current && roomCode && roomState?.state === 'waiting') {
      justSubmitted.current = false;
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, roomState?.state, router]);

  const handle = () => {
    const t = name.trim();
    if (!t || t.length < 2) {
      setError('Enter at least 2 characters');
      return;
    }
    setLoading(true);
    setError('');
    justSubmitted.current = true;
    const promptsToSend = isCustomMode ? customPrompts.slice(0, rounds) : undefined;
    createRoom(t, rounds, timerSeconds, promptsToSend);
    setTimeout(() => setLoading(false), 6000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <Input
        label="Your Name"
        placeholder="e.g. Arjun"
        value={name}
        onChange={(e) => {
          setName(e.target.value.slice(0, MAX_NAME_LENGTH));
          setError('');
        }}
        onKeyDown={(e) => e.key === 'Enter' && !isCustomMode && handle()}
        error={error}
        autoFocus
      />

      <Segmented
        label="Rounds"
        options={ROUND_CHOICES.map((r) => ({ value: r, label: String(r) }))}
        value={rounds}
        onChange={setRounds}
      />

      <Segmented
        label="Timer per Round"
        options={TIMER_CHOICES.map((s) => ({ value: s, label: `${s}s` }))}
        value={timerSeconds}
        onChange={setTimerSeconds}
      />

      <Segmented
        label="Category Mode"
        options={[
          { value: 'random', label: 'Random AI' },
          { value: 'custom', label: 'Custom Prompt' },
        ]}
        value={isCustomMode ? 'custom' : 'random'}
        onChange={(v) => setIsCustomMode(v === 'custom')}
      />

      {isCustomMode && (
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto border border-[var(--border)] p-3 bg-[var(--surface-2)]">
          <p className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
            Round Prompts
          </p>
          {Array.from({ length: rounds }).map((_, idx) => (
            <Input
              key={idx}
              label={`Round ${idx + 1}`}
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

      <Button onClick={handle} loading={loading} size="lg" className="w-full mt-1 tracking-[0.18em]">
        CREATE ROOM
      </Button>
      <p className="text-center text-xs text-[var(--text-muted)]">
        You&apos;ll get a 6-letter code to share
      </p>
    </Modal>
  );
}

// ---- Join Room Modal ----
export function JoinRoomModal({
  isOpen,
  onClose,
  prefillCode = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  prefillCode?: string;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const router = useRouter();
  const { joinRoom, roomCode, roomState } = useRoom();
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
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setErrors({});
    justSubmitted.current = true;
    joinRoom(c, t);
    setTimeout(() => setLoading(false), 6000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
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
        className="font-mono font-bold text-2xl tracking-[0.28em] text-center"
        maxLength={6}
        autoFocus
      />
      <Input
        label="Your Name"
        placeholder="e.g. Priya"
        value={name}
        onChange={(e) => {
          setName(e.target.value.slice(0, MAX_NAME_LENGTH));
          setErrors((p) => ({ ...p, name: undefined }));
        }}
        onKeyDown={(e) => e.key === 'Enter' && handle()}
        error={errors.name}
      />
      <Button onClick={handle} loading={loading} size="lg" className="w-full mt-1 tracking-[0.18em]">
        JOIN ROOM
      </Button>
    </Modal>
  );
}

// ---- Segmented control (local, used by Create) ----
interface SegOpt<T> {
  value: T;
  label: string;
}
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegOpt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-display font-semibold text-[var(--text-muted)] uppercase tracking-[0.18em]">
        {label}
      </label>
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={
                'flex-1 py-2.5 text-sm font-display font-bold border transition-colors duration-150 ' +
                (active
                  ? 'bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-dim)] hover:text-[var(--text)]')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
