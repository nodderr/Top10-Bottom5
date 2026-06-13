'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 't10b5-theme';

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * A two-cell brutalist toggle. Both glyphs always render; the active one
 * sits inside an inverted plate so the control reads as a deliberate switch
 * (not a single icon button that mysteriously changes meaning). Matches the
 * square-corner / monoline language used elsewhere in the header.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readInitialTheme());
    setMounted(true);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage might be unavailable (private mode, quota); the in-DOM
      // attribute still applies for the rest of the session.
    }
  };

  // Pre-mount: render a non-interactive placeholder that occupies the same
  // space so the header layout is identical. Skipping the render entirely
  // would cause a layout shift the moment the toggle hydrates.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-8 w-[60px] border border-[var(--border)] bg-[var(--surface)]"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-flex h-8 items-stretch border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors overflow-hidden"
    >
      {/* Sliding active plate — sits behind both glyph buttons. Square plate,
          translates between the two cells. transform > left animation because
          GPU-cheap and the brutalist look benefits from a snappy slide. */}
      <span
        aria-hidden
        className="absolute top-0 left-0 h-full w-1/2 bg-[var(--text)] transition-transform duration-200 ease-out"
        style={{ transform: isDark ? 'translateX(100%)' : 'translateX(0%)' }}
      />

      <button
        type="button"
        onClick={() => apply('light')}
        aria-pressed={!isDark}
        aria-label="Light theme"
        title="Light"
        className={`relative z-10 grid place-items-center w-[30px] transition-colors ${
          isDark ? 'text-[var(--text-muted)] hover:text-[var(--text)]' : 'text-[var(--bg)]'
        }`}
      >
        <SunGlyph />
      </button>
      <button
        type="button"
        onClick={() => apply('dark')}
        aria-pressed={isDark}
        aria-label="Dark theme"
        title="Dark"
        className={`relative z-10 grid place-items-center w-[30px] transition-colors ${
          isDark ? 'text-[var(--bg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        <MoonGlyph />
      </button>
    </div>
  );
}

/* Hand-drawn glyphs at 14px. Stroke-only — they share the line weight of
   the dropdown caret and the rest of the header's monoline detailing. */

function SunGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square">
      <circle cx="7" cy="7" r="2.6" />
      <path d="M7 1v1.6M7 11.4V13M1 7h1.6M11.4 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1" />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="miter">
      <path d="M11.4 8.2A4.6 4.6 0 0 1 5.8 2.6a.4.4 0 0 0-.55-.42A5.4 5.4 0 1 0 11.82 8.75a.4.4 0 0 0-.42-.55Z" />
    </svg>
  );
}
