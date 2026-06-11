'use client';

interface TimerProps {
  seconds: number;
  totalSeconds?: number;
}

export function Timer({ seconds, totalSeconds = 90 }: TimerProps) {
  const pct = Math.max(0, seconds / totalSeconds);
  const isUrgent = seconds <= 15;
  const isWarning = seconds <= 30;

  const color = isUrgent ? 'var(--danger)' : isWarning ? '#FBBF24' : 'var(--success)';

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      {/* Progress bar */}
      <div className="w-16 h-1 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
      {/* Digits */}
      <span
        className={`font-display font-black text-2xl tabular-nums leading-none ${isUrgent ? 'timer-urgent' : ''}`}
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}
