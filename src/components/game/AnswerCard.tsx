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
  const scoreValue = points * 1000;

  return (
    <div
      className="answer-card"
    >
      {show && revealed ? (
        <motion.div
          className="flex items-center justify-between w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {/* Answer Text */}
          <span className="font-sans font-bold text-base text-[#202124] text-left truncate uppercase tracking-wide">
            {revealed.answer}
          </span>
          {/* Points */}
          <span className="font-sans font-bold text-base text-[#1A73E8] flex-shrink-0 ml-2">
            {scoreValue.toLocaleString()}
          </span>
        </motion.div>
      ) : (
        /* Centered Rank Badge */
        <div className="flex items-center justify-center w-full">
          <span className="bg-[#F1F3F4] text-[#5F6368] font-sans font-bold text-sm w-8 h-8 flex items-center justify-center rounded-none border border-[#DADCE0] select-none">
            {rank}
          </span>
        </div>
      )}
    </div>
  );
}
