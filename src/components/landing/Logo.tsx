'use client';

import { motion } from 'framer-motion';

const TOP10 = [
  { ch: 'T', color: '#4285F4' },
  { ch: 'o', color: '#EA4335' },
  { ch: 'p', color: '#FBBC05' },
  { ch: '1', color: '#4285F4', leadGap: true },
  { ch: '0', color: '#34A853' },
];

const BOTTOM5 = [
  { ch: 'B', color: '#EA4335' },
  { ch: 'o', color: '#4285F4' },
  { ch: 't', color: '#FBBC05' },
  { ch: 't', color: '#34A853' },
  { ch: 'o', color: '#EA4335' },
  { ch: 'm', color: '#4285F4' },
  { ch: '5', color: '#34A853', leadGap: true },
];

export function Logo() {
  return (
    <div className="text-center select-none flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-display font-extrabold tracking-tight leading-[0.95]"
        style={{ fontSize: 'clamp(3.75rem, 11vw, 7rem)' }}
      >
        {TOP10.map((l, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block hover:-translate-y-0.5 transition-transform duration-200"
            style={{ color: l.color, marginLeft: l.leadGap ? '0.22em' : 0 }}
          >
            {l.ch}
          </motion.span>
        ))}
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="font-display font-extrabold tracking-tight leading-[0.95] mt-2"
        style={{ fontSize: 'clamp(2.1rem, 6.4vw, 3.75rem)' }}
      >
        {BOTTOM5.map((l, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block hover:-translate-y-0.5 transition-transform duration-200"
            style={{ color: l.color, marginLeft: l.leadGap ? '0.16em' : 0 }}
          >
            {l.ch}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="font-display text-[var(--text-muted)] text-[11px] sm:text-xs font-bold tracking-[0.32em] uppercase mt-6"
      >
        GUESS · WHAT · THE · AI · RANKED
      </motion.p>
    </div>
  );
}
