'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MyRating } from './MyRating';
import { ThemeToggle } from './ThemeToggle';

// Hidden inside an active game so the header doesn't compete with the round HUD.
const HIDE_PATTERNS = [/^\/room\//];

export function SiteHeader() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Leaderboard SSRs a heavy page (profile prefetch + chart). Show a spinner
  // while the App Router transition is pending so the click feels responsive.
  const [leaderboardPending, startLeaderboardTransition] = useTransition();

  // Outside-click to close the dropdown.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  if (HIDE_PATTERNS.some((re) => re.test(pathname))) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/70">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-extrabold text-base tracking-tight text-[var(--text)] hover:opacity-90"
        >
          <span className="flex gap-1">
            <span className="w-2 h-2 bg-[var(--blue)]" />
            <span className="w-2 h-2 bg-[var(--red)]" />
            <span className="w-2 h-2 bg-[var(--yellow)]" />
            <span className="w-2 h-2 bg-[var(--green)]" />
          </span>
          <span className="hidden sm:inline">Top 10 Bottom 5</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <MyRating />
          <button
            onClick={() => {
              if (pathname === '/leaderboard' || leaderboardPending) return;
              startLeaderboardTransition(() => {
                router.push('/leaderboard');
              });
            }}
            disabled={leaderboardPending}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] md:text-xs font-display font-bold uppercase tracking-[0.2em] transition-colors ${
              pathname === '/leaderboard'
                ? 'text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Leaderboard
            {leaderboardPending && (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          {loading ? (
            <span className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="font-display font-extrabold text-xs text-[var(--text)]">
                  @{user.handle}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">▾</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow)] py-1.5 z-50"
                >
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="font-display font-extrabold text-sm text-[var(--text)] truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      router.refresh();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-display font-bold uppercase tracking-[0.18em] text-[var(--danger)] hover:bg-[var(--surface-2)]"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="px-3 py-1.5 text-[11px] md:text-xs font-display font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 text-[11px] md:text-xs font-display font-bold uppercase tracking-[0.2em] bg-[var(--primary)] text-[var(--primary-text)] hover:bg-[var(--primary-2)]"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
