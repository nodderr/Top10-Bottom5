'use client';

import { useMemo } from 'react';
import { RevealedAnswer, RankedAnswer } from '@/types/game';
import { AnswerCard } from './AnswerCard';

interface AnswerBoardProps {
  revealed: RevealedAnswer[];
  allAnswers?: RankedAnswer[];
  newlyRevealedRank?: number | null;
}

export function AnswerBoard({ revealed, allAnswers, newlyRevealedRank }: AnswerBoardProps) {
  const displayMap = useMemo(() => {
    const m = new Map<number, RevealedAnswer>();
    for (const r of revealed) m.set(r.rank, r);
    if (allAnswers) {
      for (const a of allAnswers) {
        if (!m.has(a.rank)) {
          m.set(a.rank, { rank: a.rank, answer: a.answer, foundBy: '', foundById: '', points: 0 });
        }
      }
    }
    return m;
  }, [revealed, allAnswers]);

  return (
    <div className="w-full border border-[var(--border)] grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-col md:border-r border-[var(--border)]">
        {[1, 2, 3, 4, 5].map((rank) => (
          <AnswerCard
            key={rank}
            rank={rank}
            revealed={displayMap.get(rank)}
            isNew={rank === newlyRevealedRank}
          />
        ))}
      </div>
      <div className="flex flex-col">
        {[6, 7, 8, 9, 10].map((rank) => (
          <AnswerCard
            key={rank}
            rank={rank}
            revealed={displayMap.get(rank)}
            isNew={rank === newlyRevealedRank}
          />
        ))}
      </div>
    </div>
  );
}
