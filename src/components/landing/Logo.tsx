'use client';

export function Logo() {
  return (
    <div className="text-center select-none">
      <h1
        className="font-display font-black leading-none"
        style={{ fontSize: 'clamp(3.5rem, 12vw, 8rem)', letterSpacing: '-0.02em' }}
      >
        <span style={{ color: 'var(--primary)' }}>TOP 10</span>
      </h1>

      <div className="flex items-center gap-4 my-3 justify-center">
        <div className="h-px flex-1 max-w-20 bg-[var(--border-strong)]" />
        <span className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] uppercase">bottom 5</span>
        <div className="h-px flex-1 max-w-20 bg-[var(--border-strong)]" />
      </div>

      <p className="text-[var(--text-muted)] text-base font-medium tracking-wide">
        Guess what made the list.
      </p>
    </div>
  );
}
