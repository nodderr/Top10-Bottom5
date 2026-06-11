'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number;
  totalSeconds?: number;
}

export function Timer({ seconds, totalSeconds = 90 }: TimerProps) {
  const progress = seconds / totalSeconds;
  const isUrgent = seconds <= 15;
  const isWarning = seconds <= 30;

  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const color = isUrgent
    ? 'var(--danger)'
    : isWarning
    ? '#FFB84A'
    : 'var(--success)';

  const glowColor = isUrgent
    ? 'var(--danger-glow)'
    : isWarning
    ? 'rgba(255,184,74,0.4)'
    : 'var(--success-glow)';

  return (
    <div
      className={`relative flex items-center justify-center ${isUrgent ? 'timer-urgent' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-card-elevated)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>

      <motion.span
        key={seconds}
        className="font-display font-black text-xl relative z-10"
        style={{ color }}
        animate={{ scale: seconds <= 10 && seconds > 0 ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {seconds}
      </motion.span>
    </div>
  );
}
