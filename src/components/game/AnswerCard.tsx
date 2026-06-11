'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealedAnswer } from '@/types/game';

interface AnswerCardProps {
  rank: number;
  revealed?: RevealedAnswer;
  isNew?: boolean; // just revealed this instant
}

const RANK_COLORS = [
  '#FFD700', '#C0C0C0', '#CD7F32', // 1, 2, 3
  '#FFD54A', '#FFD54A', '#FFD54A', // 4, 5, 6
  '#8A8FA8', '#8A8FA8', '#8A8FA8', '#8A8FA8', // 7-10
];

const RANK_BG = [
  'rgba(255,215,0,0.15)',
  'rgba(192,192,192,0.1)',
  'rgba(205,127,50,0.1)',
  'rgba(255,213,74,0.08)',
  'rgba(255,213,74,0.08)',
  'rgba(255,213,74,0.08)',
  'rgba(138,143,168,0.06)',
  'rgba(138,143,168,0.06)',
  'rgba(138,143,168,0.06)',
  'rgba(138,143,168,0.06)',
];

export function AnswerCard({ rank, revealed, isNew = false }: AnswerCardProps) {
  const [flipped, setFlipped] = useState(!!revealed && !isNew);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (revealed && isNew) {
      // Small delay, then flip
      const t1 = setTimeout(() => setFlipped(true), 50);
      const t2 = setTimeout(() => setGlowing(true), 300);
      const t3 = setTimeout(() => setGlowing(false), 1100);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (revealed && !flipped) {
      setFlipped(true);
    }
  }, [revealed, isNew, flipped]);

  const points = revealed ? (11 - rank) : null;
  const color = RANK_COLORS[rank - 1] ?? '#8A8FA8';
  const bg = RANK_BG[rank - 1] ?? 'rgba(138,143,168,0.06)';

  return (
    <div className="card-flip-container" style={{ height: '56px' }}>
      <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`}>
        {/* Front — hidden */}
        <div
          className="card-face flex items-center gap-3 px-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <span
            className="font-display font-black text-sm flex-shrink-0 w-6 text-right"
            style={{ color }}
          >
            {rank}
          </span>
          <div className="flex-1 flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-2.5 rounded-full flex-1"
                style={{ background: 'var(--bg-card-elevated)', maxWidth: `${20 + (i % 3) * 10}px` }}
              />
            ))}
          </div>
          <span className="text-[var(--text-muted)] text-xs font-bold">
            {11 - rank}pts
          </span>
        </div>

        {/* Back — revealed */}
        <motion.div
          className="card-back card-face flex items-center gap-3 px-4"
          style={{
            background: bg,
            border: `1px solid ${color}40`,
            boxShadow: glowing ? `0 0 24px ${color}60, 0 0 60px ${color}20` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <span
            className="font-display font-black text-sm flex-shrink-0 w-6 text-right"
            style={{ color }}
          >
            {rank}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-800 text-sm text-[var(--text)] truncate">
              {revealed?.answer}
            </p>
            {revealed?.foundBy && (
              <p className="text-xs text-[var(--text-muted)] truncate">
                by {revealed.foundBy}
              </p>
            )}
          </div>
          <AnimatePresence>
            {isNew && glowing && (
              <motion.span
                className="font-display font-black text-sm flex-shrink-0"
                style={{ color: 'var(--success)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                +{points}
              </motion.span>
            )}
            {(!isNew || !glowing) && revealed && (
              <span className="font-display font-black text-xs flex-shrink-0" style={{ color }}>
                {points}pt{points !== 1 ? 's' : ''}
              </span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
