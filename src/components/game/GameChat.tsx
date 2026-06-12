'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/game';

interface GameChatProps {
  chatMessages: ChatMessage[];
}

export function GameChat({ chatMessages }: GameChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 text-sm min-h-0"
    >
      {chatMessages.length === 0 ? (
        <p className="text-xs text-[var(--text-dim)] italic text-center my-auto">
          Guesses will appear here…
        </p>
      ) : (
        chatMessages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="text-[var(--success)] font-display font-bold leading-snug text-xs md:text-sm float-up"
              >
                <span className="mr-1">✓</span>
                {msg.text}
              </div>
            );
          }
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-[var(--blue)] text-[11px] font-display font-semibold italic leading-snug opacity-80"
              >
                {msg.text}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className="text-[var(--text-muted)] leading-snug text-xs md:text-sm"
            >
              <span className="font-display font-bold text-[var(--text)]">{msg.sender}:</span>{' '}
              {msg.text}
            </div>
          );
        })
      )}
    </div>
  );
}
