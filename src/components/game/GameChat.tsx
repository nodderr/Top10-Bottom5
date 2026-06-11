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
      className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 text-sm font-sans"
      style={{ minHeight: '160px' }}
    >
      {chatMessages.length === 0 ? (
        <p className="text-xs text-[var(--text-dim)] italic text-center my-auto">
          Guesses will appear here...
        </p>
      ) : (
        chatMessages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div key={msg.id} className="text-[#34A853] font-bold leading-snug text-xs md:text-sm">
                🎉 {msg.text}
              </div>
            );
          }
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-[#1A73E8] text-xs font-semibold italic leading-snug">
                ℹ️ {msg.text}
              </div>
            );
          }
          return (
            <div key={msg.id} className="text-[var(--text-muted)] leading-snug text-xs md:text-sm">
              <span className="font-bold text-[var(--text)]">{msg.sender}:</span> {msg.text}
            </div>
          );
        })
      )}
    </div>
  );
}
