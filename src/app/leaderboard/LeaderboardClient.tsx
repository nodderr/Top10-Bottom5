'use client';

import { useCallback, useState } from 'react';
import { LeaderboardList, LeaderboardEntry } from './LeaderboardList';
import { UserProfilePanel } from './UserProfilePanel';
import { ProfileData } from '@/lib/profile-data';

interface Props {
  entries: LeaderboardEntry[];
  viewerHandle: string | null;
  profilesByHandle: Record<string, ProfileData>;
}

// Read the initial selection from the URL on the very first render. After
// that, selection lives in client state and we sync the URL via
// history.replaceState — no router involvement, no server roundtrip.
function readInitialHandle(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('u');
}

export function LeaderboardClient({ entries, viewerHandle, profilesByHandle }: Props) {
  const fallbackHandle = viewerHandle ?? entries[0]?.handle ?? null;
  const [selectedHandle, setSelectedHandle] = useState<string | null>(
    () => readInitialHandle() ?? fallbackHandle,
  );

  const select = useCallback((handle: string) => {
    setSelectedHandle(handle);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('u', handle);
      window.history.replaceState(null, '', url);
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  const profile = selectedHandle ? profilesByHandle[selectedHandle] : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      <section className="w-full lg:w-1/2 lg:sticky lg:top-20">
        {selectedHandle ? (
          <UserProfilePanel handle={selectedHandle} cachedProfile={profile} />
        ) : (
          <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] py-12 px-6 text-center">
            <p className="text-3xl mb-2">👈</p>
            <p className="font-display font-bold text-[var(--text-muted)]">
              Select a player to see their stats
            </p>
          </div>
        )}
      </section>
      <section className="w-full lg:w-1/2">
        <LeaderboardList
          entries={entries}
          viewerHandle={viewerHandle}
          selectedHandle={selectedHandle}
          onSelect={select}
        />
      </section>
    </div>
  );
}
