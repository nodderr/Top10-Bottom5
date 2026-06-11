'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { Player } from '@/types/game';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function PlayerRow({ player, index }: { player: Player; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0"
    >
      {/* Avatar — simple square */}
      <div className="w-8 h-8 rounded-none bg-[var(--surface-2)] border border-[var(--border-strong)] flex items-center justify-center font-display font-bold text-xs text-[var(--text-muted)] flex-shrink-0">
        {initials(player.name)}
      </div>
 
      <span className="flex-1 text-sm font-medium text-[var(--text)] truncate">
        {player.name}
        {player.isHost && (
          <span className="ml-2 text-xs text-[#1A73E8] font-bold">HOST</span>
        )}
      </span>
 
      {/* Ready dot/square */}
      <div className={`w-2.5 h-2.5 rounded-none flex-shrink-0 ${
        player.isHost || player.isReady
          ? 'bg-[var(--success)]'
          : 'bg-[var(--border-strong)]'
      }`} />
    </motion.div>
  );
}

export function LobbyScreen() {
  const { roomState, roomCode, isHost, startGame } = useRoom();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!roomState || !roomCode) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Room code */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-2">
            Room Code
          </p>
          <button onClick={copyCode} className="group">
            <span className="font-display font-black text-5xl tracking-[0.2em] text-[#1A73E8]">
              {roomCode}
            </span>
            <p className="text-xs text-[var(--text-muted)] mt-1 group-hover:text-[var(--text)] transition-colors">
              {copied ? '✓ copied' : 'tap to copy'}
            </p>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)]" />

        {/* Players */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Players
            </p>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {roomState.players.length}/12
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {roomState.players.map((p: Player, i: number) => (
              <PlayerRow key={p.id} player={p} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Game info */}
        <div className="flex gap-4 text-center">
          {[
            { label: 'Rounds', value: roomState.totalRounds },
            { label: 'Answers', value: 10 },
            { label: 'Timer', value: '90s' },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 border border-[var(--border)] rounded-none py-3">
              <p className="font-display font-black text-xl text-[#1A73E8]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        {isHost ? (
          <Button
            onClick={() => { setStarting(true); startGame(); }}
            loading={starting}
            size="lg"
            className="w-full font-display tracking-widest"
          >
            {starting ? 'Starting...' : 'START GAME'}
          </Button>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-[var(--text-muted)]">
              Waiting for host to start...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
