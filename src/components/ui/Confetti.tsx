'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const PALETTE = ['#1A73E8', '#EA4335', '#FBBC05', '#34A853'];

interface ConfettiProps {
  count?: number;
  spread?: number; // pixels left/right
  duration?: number; // seconds
}

/**
 * Pure-CSS / Motion confetti burst — no canvas, no extra deps.
 * Renders absolutely-positioned squares from the center, animating outward
 * with random trajectories. Mount on a milestone (round end, game end).
 */
export function Confetti({ count = 36, spread = 320, duration = 2.2 }: ConfettiProps) {
  // useState lazy init — runs ONCE on mount, so Math.random is OK here
  // (vs. useMemo, which the new react-hooks/purity rule flags as impure-during-render).
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      color: PALETTE[i % PALETTE.length],
      dx: (Math.random() - 0.5) * spread * 2,
      dy: -(Math.random() * 220 + 60),
      fall: Math.random() * 240 + 360,
      rot: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.25,
      scale: 0.7 + Math.random() * 0.6,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="confetti-piece"
          style={{ background: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: p.scale }}
          animate={{
            x: p.dx,
            y: p.dy + p.fall,
            rotate: p.rot,
            opacity: 0,
            scale: p.scale,
          }}
          transition={{
            duration,
            delay: p.delay,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}
