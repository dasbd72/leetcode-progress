import { useState } from 'react';

import { type IntervalKey, useProgressQuery } from '@/api/progress';
import { Announcements } from '@/components/announcements/Announcements';
import { KpiTiles } from '@/components/dashboard/KpiTiles';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { Panel } from '@/components/ui/panel';
import { computeKpis } from '@/lib/progress';

export function Dashboard() {
  const [interval, setInterval] = useState<IntervalKey>('day');
  const query = useProgressQuery(interval);

  return (
    <div className="grid gap-[14px]">
      <Announcements />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[26px] leading-none font-semibold -tracking-[0.01em]">
          LeetCode progress
        </h1>
        <p className="tabular text-muted text-xs">snapshot every 20 min</p>
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
          <ProgressPanel data={query.data} interval={interval} onIntervalChange={setInterval} />
          <Leaderboard data={query.data} />
        </>
      )}
    </div>
  );
}
