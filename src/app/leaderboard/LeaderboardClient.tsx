'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LeaderboardList, LeaderboardEntry } from './LeaderboardList';
import { UserProfilePanel } from './UserProfilePanel';
import { ProfileData } from '@/lib/profile-data';

interface Props {
  entries: LeaderboardEntry[];
  viewerHandle: string | null;
  profilesByHandle: Record<string, ProfileData>;
}

function LeaderboardSplit({ entries, viewerHandle, profilesByHandle }: Props) {
  const searchParams = useSearchParams();
  const urlHandle = searchParams?.get('u') ?? null;

  // URL is the source of truth. Falls back to viewer, then the top entry.
  const selectedHandle =
    urlHandle ?? viewerHandle ?? entries[0]?.handle ?? null;

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
        />
      </section>
    </div>
  );
}

export function LeaderboardClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LeaderboardSplit {...props} />
    </Suspense>
  );
}
