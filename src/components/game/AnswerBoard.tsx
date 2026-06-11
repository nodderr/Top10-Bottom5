'use client';

import { useMemo, useRef } from 'react';
import { RevealedAnswer, RankedAnswer } from '@/types/game';
import { AnswerCard } from './AnswerCard';

interface AnswerBoardProps {
  revealed: RevealedAnswer[];
  totalAnswers?: number;
  // For round-end reveal — pass full list to show all answers
  allAnswers?: RankedAnswer[];
  newlyRevealedRank?: number | null;
}

export function AnswerBoard({
  revealed,
  totalAnswers = 10,
  allAnswers,
  newlyRevealedRank,
}: AnswerBoardProps) {
  const prevRevealedRef = useRef<Set<number>>(new Set());

  const revealedMap = useMemo(() => {
    const map = new Map<number, RevealedAnswer>();
    for (const r of revealed) map.set(r.rank, r);
    return map;
  }, [revealed]);

  // For round-end: merge allAnswers into the revealed map (unfound ones shown without foundBy)
  const displayMap = useMemo(() => {
    if (!allAnswers) return revealedMap;
    const merged = new Map(revealedMap);
    for (const a of allAnswers) {
      if (!merged.has(a.rank)) {
        merged.set(a.rank, { rank: a.rank, answer: a.answer, foundBy: '', foundById: '', points: 0 });
      }
    }
    return merged;
  }, [allAnswers, revealedMap]);

  const slots = Array.from({ length: totalAnswers }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-2 w-full">
      {slots.map((rank) => {
        const revealed = displayMap.get(rank);
        const isNew = rank === newlyRevealedRank;
        return (
          <AnswerCard
            key={rank}
            rank={rank}
            revealed={revealed}
            isNew={isNew}
          />
        );
      })}
    </div>
  );
}
