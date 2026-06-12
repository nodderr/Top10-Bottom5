'use client';

import { motion } from 'framer-motion';
import { RevealedAnswer } from '@/types/game';

interface AnswerCardProps {
  rank: number;
  revealed?: RevealedAnswer;
  isNew?: boolean;
}

export function AnswerCard({ rank, revealed, isNew = false }: AnswerCardProps) {
  // Round-end progressive reveals come through with points=0 — fall back to
  // the canonical rank-based value so the card still shows points.
  const scoreValue = revealed?.points || (11 - rank) * 1000;

  return (
    <div
      className="flex items-center min-h-[64px] px-5 py-3 border-b border-[var(--border)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--surface-2)]"
      style={{ perspective: '600px' }}
    >
      {revealed ? (
        <motion.div
          // Card-flip reveal — newly-revealed cards flip in from edge,
          // already-revealed cards (entering players, round-end fill) just fade.
          initial={isNew ? { rotateX: -82, opacity: 0 } : { opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            duration: isNew ? 0.42 : 0.18,
            delay: isNew ? 0.04 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex items-center justify-between w-full gap-3"
          style={{ transformOrigin: 'bottom' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display font-extrabold text-xs text-[var(--text-dim)] tabular w-5 shrink-0">
              {rank}
            </span>
            <span className="font-display font-bold text-base text-[var(--text)] text-left truncate uppercase tracking-wide">
              {revealed.answer}
            </span>
          </div>
          <span className="font-display font-extrabold text-base text-[var(--blue)] shrink-0 tabular">
            {scoreValue.toLocaleString()}
          </span>
        </motion.div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <span className="bg-[var(--surface-2)] text-[var(--text-muted)] font-display font-bold text-sm w-8 h-8 flex items-center justify-center border border-[var(--border)] select-none">
            {rank}
          </span>
        </div>
      )}
    </div>
  );
}
