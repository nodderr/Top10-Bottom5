'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';

interface LeaderboardProps {
  players: Player[];
  scores: Record<string, number>;
  myId: string | null;
  compact?: boolean;
}

function Medal({ position }: { position: number }) {
  if (position === 1) return <span>🥇</span>;
  if (position === 2) return <span>🥈</span>;
  if (position === 3) return <span>🥉</span>;
  return <span className="text-[var(--text-muted)] text-sm font-bold">{position}</span>;
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

export function Leaderboard({ players, scores, myId, compact = false }: LeaderboardProps) {
  const sorted = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence mode="popLayout">
        {sorted.map((player, index) => {
          const score = scores[player.id] ?? 0;
          const isMe = player.id === myId;
          const position = index + 1;

          return (
            <motion.div
              key={player.id}
              layout
              layoutId={`lb-${player.id}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring', damping: 20 }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 ${
                isMe
                  ? 'bg-[rgba(255,213,74,0.08)] border-[rgba(255,213,74,0.25)]'
                  : 'bg-[var(--bg-card-elevated)] border-[var(--border)]'
              }`}
            >
              {/* Position */}
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                <Medal position={position} />
              </div>

              {/* Avatar */}
              {!compact && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs text-[#0F1115] flex-shrink-0"
                  style={{ background: stringToGradient(player.name) }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <p className={`flex-1 min-w-0 font-display font-700 truncate text-sm ${isMe ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                {player.name}
                {isMe && <span className="ml-1 text-xs opacity-70">(you)</span>}
              </p>

              {/* Score */}
              <motion.span
                key={`score-${score}`}
                className="font-display font-black text-sm flex-shrink-0"
                style={{ color: isMe ? 'var(--primary)' : 'var(--text)' }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
              >
                {score}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
