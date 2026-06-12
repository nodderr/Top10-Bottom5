'use client';

import { motion } from 'framer-motion';
import { Player } from '@/types/game';

interface LeaderboardProps {
  players: Player[];
  scores: Record<string, number>;
  myId: string | null;
  compact?: boolean;
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const PALETTE = ['#1A73E8', '#EA4335', '#FBBC05', '#34A853'];
function colorFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 999983;
  return PALETTE[sum % PALETTE.length];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard({ players, scores, myId, compact = false }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    const scoreA = scores[a.id] ?? a.score ?? 0;
    const scoreB = scores[b.id] ?? b.score ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((player, i) => {
        const score = scores[player.id] ?? player.score ?? 0;
        const isMe = player.id === myId;
        const offline = player.disconnected === true;
        const color = colorFor(player.id);

        return (
          <motion.div
            key={player.id}
            layout
            layoutId={`lb-${player.id}`}
            transition={{ duration: 0.32, type: 'spring', damping: 22, stiffness: 320 }}
            className={`flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-0 ${
              isMe ? 'text-[var(--primary)]' : 'text-[var(--text)]'
            } ${offline ? 'opacity-50' : ''}`}
          >
            <span className="w-6 text-sm text-center shrink-0">
              {i < 3 ? (
                <span>{MEDALS[i]}</span>
              ) : (
                <span className="text-[var(--text-muted)] font-display font-bold text-xs tabular">
                  {i + 1}
                </span>
              )}
            </span>

            {!compact && (
              <div
                className="w-7 h-7 flex items-center justify-center text-[10px] font-display font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {initials(player.name)}
              </div>
            )}

            <span className="flex-1 text-sm font-medium truncate">
              {player.name}
              {isMe && <span className="text-[10px] opacity-60 ml-1 font-display font-bold">YOU</span>}
            </span>

            <motion.span
              key={score}
              className="font-display font-extrabold text-sm shrink-0 tabular"
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.28 }}
            >
              {score.toLocaleString()}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
