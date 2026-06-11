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
    <div className="w-full border border-[var(--border)] rounded-lg overflow-hidden">
      {Array.from({ length: totalAnswers }, (_, i) => i + 1).map((rank) => (
        <AnswerCard
          key={rank}
          rank={rank}
          revealed={displayMap.get(rank)}
          isNew={rank === newlyRevealedRank}
        />
      ))}
    </div>
  );
}
