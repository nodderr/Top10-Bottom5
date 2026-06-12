'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const PHRASES = [
  'Calling the AI…',
  'Ranking the list…',
  'Picking the spicy take…',
  'Sorting #1 through #10…',
];

export function GeneratingScreen() {
  // Pick once per mount; Math.random in render is flagged as impure.
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-7">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-2.5 h-2.5"
              style={{ background: ['#1A73E8', '#EA4335', '#FBBC05', '#34A853'][i] }}
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <div>
          <p className="font-display font-bold text-xl text-[var(--text)] mb-1">AI is thinking…</p>
          <motion.p
            key="phrase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-[var(--text-muted)]"
          >
            {phrase}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
