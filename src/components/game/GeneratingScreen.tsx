'use client';

export function GeneratingScreen() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--primary)] rounded-full animate-spin" />
        <div>
          <p className="font-display font-bold text-lg text-[var(--text)] mb-1">
            AI is thinking...
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Generating this round&apos;s ranking list
          </p>
        </div>
      </div>
    </div>
  );
}
