'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RevealedAnswer } from '@/types/game';

interface AnswerCardProps {
  rank: number;
  revealed?: RevealedAnswer;
  isNew?: boolean;
}

export function AnswerCard({ rank, revealed, isNew = false }: AnswerCardProps) {
  const [show, setShow] = useState(!!revealed && !isNew);

  useEffect(() => {
    if (revealed && isNew) {
      const t = setTimeout(() => setShow(true), 60);
      return () => clearTimeout(t);
    }
    if (revealed && !show) setShow(true);
  }, [revealed, isNew, show]);

  const points = 11 - rank;
  const isTop3 = rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 px-4 h-14 border-b border-[var(--border)] transition-colors ${
        show ? 'bg-[var(--surface)]' : 'bg-transparent'
      }`}
    >
      {/* Rank */}
      <span
        className="w-7 text-center font-display font-black text-base flex-shrink-0"
        style={{ color: isTop3 ? 'var(--primary)' : 'var(--text-dim)' }}
      >
        {rank}
      </span>

      {/* Separator */}
      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* Answer */}
      <div className="flex-1 min-w-0">
        {show && revealed ? (
          <motion.span
            className="font-display font-bold text-base text-[var(--text)] answer-reveal block"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {revealed.answer}
          </motion.span>
        ) : (
          <span className="font-display font-bold text-base text-[var(--text-dim)] select-none tracking-widest block leading-none">
            {'— — — — —'}
          </span>
        )}
      </div>

      {/* Points */}
      <span
        className={`text-sm font-bold flex-shrink-0 text-right w-12 ${
          show ? 'text-[var(--text-muted)]' : 'text-[var(--text-dim)]'
        }`}
      >
        {points}pt
      </span>
    </div>
  );
}
