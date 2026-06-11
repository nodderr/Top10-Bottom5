'use client';

import { useMemo } from 'react';
import { RevealedAnswer, RankedAnswer } from '@/types/game';
import { AnswerCard } from './AnswerCard';

interface AnswerBoardProps {
  revealed: RevealedAnswer[];
  totalAnswers?: number;
  allAnswers?: RankedAnswer[];
  newlyRevealedRank?: number | null;
}

export function AnswerBoard({ revealed, totalAnswers = 10, allAnswers, newlyRevealedRank }: AnswerBoardProps) {
  const revealedMap = useMemo(() => {
    const m = new Map<number, RevealedAnswer>();
    for (const r of revealed) m.set(r.rank, r);
    return m;
  }, [revealed]);

  const displayMap = useMemo(() => {
    if (!allAnswers) return revealedMap;
    const m = new Map(revealedMap);
    for (const a of allAnswers) {
      if (!m.has(a.rank)) {
        m.set(a.rank, { rank: a.rank, answer: a.answer, foundBy: '', foundById: '', points: 0 });
      }
    }
    return m;
  }, [allAnswers, revealedMap]);

  return (
    <div className="w-full border border-[var(--border)] grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-white shadow-sm">
      {/* Left Column (1-5) */}
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
      {/* Right Column (6-10) */}
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
