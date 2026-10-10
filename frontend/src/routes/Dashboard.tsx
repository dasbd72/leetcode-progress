import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { type Audience, type IntervalKey, useProgressQuery } from '@/api/progress';
import { Announcements } from '@/components/announcements/Announcements';
import { KpiTiles } from '@/components/dashboard/KpiTiles';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { Panel } from '@/components/ui/panel';
import { SegmentedControl } from '@/components/ui/segmented';
import { computeKpis } from '@/lib/progress';

const AUDIENCE_STORAGE_KEY = 'dashboard-audience';

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'following', label: 'Following' },
];

export function Dashboard() {
  const auth = useAuth();
  const [interval, setInterval] = useState<IntervalKey>('day');
  const [audience, setAudience] = useState<Audience>(() => {
    const stored =
      typeof localStorage !== 'undefined' ? localStorage.getItem(AUDIENCE_STORAGE_KEY) : null;
    return stored === 'following' ? 'following' : 'all';
  });

  useEffect(() => {
    localStorage.setItem(AUDIENCE_STORAGE_KEY, audience);
  }, [audience]);

  // "Following" requires auth; logged-out visitors are locked to "All".
  const effectiveAudience: Audience = auth.isAuthenticated ? audience : 'all';
  const query = useProgressQuery(interval, effectiveAudience);

  return (
    <div className="grid gap-[14px]">
      <Announcements />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[26px] leading-none font-semibold -tracking-[0.01em]">
          LeetCode progress
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {auth.isAuthenticated && (
            <SegmentedControl
              aria-label="Audience"
              options={AUDIENCE_OPTIONS}
              value={audience}
              onChange={setAudience}
            />
          )}
          <p className="tabular text-muted text-xs">snapshot every 20 min</p>
        </div>
      </div>

      {query.isLoading && <p className="text-muted py-10 text-center text-sm">Loading progress…</p>}

      {query.isError && (
        <Panel>
          <p className="text-hard text-sm">Failed to load progress. Please try again.</p>
        </Panel>
      )}

      {query.data && (
        <>
          <KpiTiles kpis={computeKpis(query.data)} solverCount={query.data.usernames.length} />
          <ProgressPanel
            data={query.data}
            interval={interval}
            onIntervalChange={setInterval}
            audience={effectiveAudience}
          />
          <Leaderboard data={query.data} />
        </>
      )}
    </div>
  );
}
