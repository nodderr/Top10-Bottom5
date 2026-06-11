'use client';

import { motion } from 'framer-motion';

export function GeneratingScreen() {
  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid flex flex-col items-center justify-center p-4">
      <div className="text-center flex flex-col items-center gap-8">
        {/* Animated ring */}
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border-4 border-[var(--danger)] border-b-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
        </div>

        <div>
          <h2 className="font-display font-black text-2xl text-[var(--text)] mb-2">
            AI is thinking...
          </h2>
          <p className="text-[var(--text-muted)] text-sm max-w-xs">
            Generating the ranking list for this round. Get ready to argue.
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
