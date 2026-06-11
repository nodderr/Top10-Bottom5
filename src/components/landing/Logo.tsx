'use client';

import { motion } from 'framer-motion';

export function Logo() {
  return (
    <div className="text-center select-none float">
      {/* TOP 10 */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        <h1
          className="font-display font-black tracking-tight leading-none"
          style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            background: 'linear-gradient(135deg, #FFD54A 0%, #FFF3B0 50%, #FFD54A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(255,213,74,0.5))',
          }}
        >
          TOP 10
        </h1>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-3 my-2 justify-center"
      >
        <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-[var(--primary)]" />
        <span className="text-[var(--text-muted)] text-sm font-semibold tracking-widest uppercase">
          vs
        </span>
        <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-[var(--primary)]" />
      </motion.div>

      {/* BOTTOM 5 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <h1
          className="font-display font-black tracking-tight leading-none"
          style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            background: 'linear-gradient(135deg, #FF5A5A 0%, #FFB3B3 50%, #FF5A5A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(255,90,90,0.4))',
          }}
        >
          BOTTOM 5
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-4 text-[var(--text-muted)] text-lg font-medium tracking-wide"
      >
        Guess what made the list.
      </motion.p>
    </div>
  );
}
