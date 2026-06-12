'use client';

interface TimerProps {
  seconds: number;
  totalSeconds?: number;
}

const R = 22; // ring radius
const CIRC = 2 * Math.PI * R;

export function Timer({ seconds, totalSeconds = 90 }: TimerProps) {
  const pct = Math.max(0, Math.min(1, seconds / totalSeconds));
  const isUrgent = seconds <= 15;
  const isWarning = seconds <= 30;
  const color = isUrgent ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="relative w-14 h-14 shrink-0" aria-label={`${seconds} seconds remaining`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx="25"
          cy="25"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="square"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.2s ease' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display font-extrabold text-lg tabular leading-none ${
          isUrgent ? 'timer-urgent' : ''
        }`}
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}
