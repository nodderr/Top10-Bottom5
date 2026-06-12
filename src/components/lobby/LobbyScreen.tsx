'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { Player } from '@/types/game';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const PALETTE = ['#1A73E8', '#EA4335', '#FBBC05', '#34A853'];
function colorFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 999983;
  return PALETTE[sum % PALETTE.length];
}

function PlayerRow({ player, index, isMe }: { player: Player; index: number; isMe: boolean }) {
  const color = colorFor(player.id);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, delay: index * 0.035, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0"
    >
      <div
        className="w-9 h-9 flex items-center justify-center font-display font-bold text-xs text-white shrink-0"
        style={{ background: color }}
      >
        {initials(player.name)}
      </div>

      <span className="flex-1 text-sm font-medium text-[var(--text)] truncate">
        {player.name}
        {isMe && <span className="ml-1.5 text-[10px] font-display font-bold text-[var(--text-dim)]">YOU</span>}
        {player.isHost && (
          <span className="ml-2 text-[10px] font-display font-extrabold tracking-[0.14em] text-[var(--blue)]">
            HOST
          </span>
        )}
      </span>

      <span
        className={`w-2 h-2 shrink-0 ${
          player.isHost || player.isReady ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]'
        }`}
      />
    </motion.div>
  );
}

export function LobbyScreen() {
  const { roomState, roomCode, isHost, myId, startGame } = useRoom();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [starting, setStarting] = useState(false);

  const shareLink = useMemo(() => {
    if (!roomCode || typeof window === 'undefined') return '';
    return `${window.location.origin}/?code=${roomCode}`;
  }, [roomCode]);

  if (!roomState || !roomCode) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied('code');
    setTimeout(() => setCopied(null), 1800);
  };
  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied('link');
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4 py-10 relative">
      <span className="hidden md:block absolute top-12 left-12 w-2 h-2 bg-[var(--blue)]" />
      <span className="hidden md:block absolute top-12 right-12 w-2 h-2 bg-[var(--red)]" />
      <span className="hidden md:block absolute bottom-12 left-12 w-2 h-2 bg-[var(--yellow)]" />
      <span className="hidden md:block absolute bottom-12 right-12 w-2 h-2 bg-[var(--green)]" />

      <div className="w-full max-w-md flex flex-col gap-7 relative z-10">
        {/* Room code card */}
        <div className="text-center">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-display font-semibold mb-3">
            Room Code
          </p>
          <button
            onClick={copyCode}
            className="group font-mono font-extrabold text-6xl tracking-[0.18em] text-[var(--blue)] hover:opacity-90 transition-opacity"
            aria-label="Copy room code"
          >
            {roomCode}
          </button>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={copyCode}
              className="text-xs font-display font-bold uppercase tracking-[0.18em] px-3 py-1.5 border border-[var(--border)] hover:border-[var(--text-dim)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {copied === 'code' ? '✓ Code copied' : 'Copy code'}
            </button>
            <button
              onClick={copyLink}
              className="text-xs font-display font-bold uppercase tracking-[0.18em] px-3 py-1.5 border border-[var(--border)] hover:border-[var(--text-dim)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {copied === 'link' ? '✓ Link copied' : 'Copy invite link'}
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* Players */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.22em] font-display font-semibold">
              Players
            </p>
            <span className="text-xs font-display font-bold text-[var(--text-muted)] tabular">
              {roomState.players.length}/12
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {roomState.players.map((p: Player, i: number) => (
              <PlayerRow key={p.id} player={p} index={i} isMe={p.id === myId} />
            ))}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-center">
          {[
            { label: 'Rounds', value: roomState.totalRounds, color: 'var(--blue)' },
            { label: 'Answers', value: 10, color: 'var(--red)' },
            { label: 'Timer', value: `${roomState.timerSeconds ?? 90}s`, color: 'var(--green)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 border border-[var(--border)] py-3.5 bg-[var(--surface)]"
            >
              <p className="font-display font-extrabold text-2xl tabular" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-display font-semibold uppercase tracking-[0.18em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Action */}
        {isHost ? (
          <Button
            onClick={() => {
              setStarting(true);
              startGame();
            }}
            loading={starting}
            size="lg"
            className="w-full tracking-[0.22em]"
          >
            {starting ? 'Starting…' : 'START GAME'}
          </Button>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-[var(--text-muted)]">Waiting for host to start…</p>
          </div>
        )}
      </div>
    </main>
  );
}
