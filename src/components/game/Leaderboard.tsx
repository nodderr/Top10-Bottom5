'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';

interface LeaderboardProps {
  players: Player[];
  scores: Record<string, number>;
  myId: string | null;
  compact?: boolean;
}

function initials(name: string) { return name.slice(0, 2).toUpperCase(); }

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ players, scores, myId, compact = false }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="flex flex-col">
      {sorted.map((player, i) => {
        const score = scores[player.id] ?? 0;
        const isMe = player.id === myId;

        return (
          <motion.div
            key={player.id}
            layout
            layoutId={`lb-${player.id}`}
            transition={{ duration: 0.25, type: 'spring', damping: 20 }}
            className={`flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-0 ${
              isMe ? 'text-[var(--primary)]' : 'text-[var(--text)]'
            }`}
          >
            {/* Rank */}
            <span className="w-6 text-sm text-center flex-shrink-0">
              {i < 3 ? MEDALS[i] : <span className="text-[var(--text-muted)] font-bold text-xs">{i + 1}</span>}
            </span>

            {!compact && (
              <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] flex-shrink-0">
                {initials(player.name)}
              </div>
            )}

            <span className="flex-1 text-sm font-medium truncate">
              {player.name}
              {isMe && <span className="text-xs opacity-60 ml-1">(you)</span>}
            </span>

            <motion.span
              key={score}
              className="font-display font-black text-sm flex-shrink-0"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.25 }}
            >
              {score}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
