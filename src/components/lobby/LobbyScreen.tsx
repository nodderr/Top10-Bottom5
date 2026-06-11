'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { useRoom } from '@/hooks/useRoom';
import { Player } from '@/types/game';

function PlayerCard({ player, index }: { player: Player; index: number }) {
  const rankColors = ['text-[var(--rank-gold)]', 'text-[var(--rank-silver)]', 'text-[var(--rank-bronze)]'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border)]"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm text-[#0F1115] flex-shrink-0"
        style={{ background: stringToGradient(player.name) }}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-700 text-sm text-[var(--text)] truncate">
          {player.name}
          {player.isHost && (
            <span className="ml-2 text-xs text-[var(--primary)] font-semibold">HOST</span>
          )}
        </p>
      </div>

      {/* Ready indicator */}
      <div
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          player.isHost || player.isReady
            ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success-glow)]'
            : 'bg-[var(--bg-card)]  border border-[var(--border)]'
        }`}
      />
    </motion.div>
  );
}

function stringToGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 70%, 45%))`;
}

export function LobbyScreen() {
  const { roomState, roomCode, myId, isHost, startGame } = useRoom();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!roomState || !roomCode) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    setStarting(true);
    startGame();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid flex flex-col items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFD54A 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display font-black text-2xl text-[var(--text)]">
            Game Lobby
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Waiting for players to join...
          </p>
        </motion.div>

        {/* Room code */}
        <motion.div
          className="glass rounded-2xl p-6 text-center border border-[var(--border)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-2">
            Room Code
          </p>
          <button
            onClick={copyCode}
            className="group relative inline-block"
          >
            <span
              className="font-display font-black tracking-[0.3em] text-5xl block transition-all duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FFD54A, #FFF3B0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(255,213,74,0.5))',
              }}
            >
              {roomCode}
            </span>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)] transition-opacity duration-200">
              {copied ? '✓ Copied!' : 'Tap to copy'}
            </span>
          </button>
          <div className="mt-8 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              Share this code with your friends
            </p>
          </div>
        </motion.div>

        {/* Players list */}
        <motion.div
          className="glass rounded-2xl p-4 border border-[var(--border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              Players
            </p>
            <span className="text-xs font-bold text-[var(--primary)] bg-[rgba(255,213,74,0.1)] px-2 py-1 rounded-lg">
              {roomState.players.length} / 12
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {roomState.players.map((player: Player, index: number) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Game info */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex-1 glass rounded-xl p-3 text-center border border-[var(--border)]">
            <p className="text-2xl font-display font-black text-[var(--primary)]">
              {roomState.totalRounds}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Rounds</p>
          </div>
          <div className="flex-1 glass rounded-xl p-3 text-center border border-[var(--border)]">
            <p className="text-2xl font-display font-black text-[var(--primary)]">10</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Answers</p>
          </div>
          <div className="flex-1 glass rounded-xl p-3 text-center border border-[var(--border)]">
            <p className="text-2xl font-display font-black text-[var(--primary)]">90s</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Per Round</p>
          </div>
        </motion.div>

        {/* Host controls */}
        {isHost ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleStart}
              size="xl"
              loading={starting}
              className="w-full font-display tracking-widest"
              disabled={starting}
            >
              {starting ? 'Generating Round...' : '▶  START GAME'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[var(--text-muted)] text-sm">
              Waiting for the host to start the game...
            </p>
            <div className="flex gap-1.5 justify-center mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--primary)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
