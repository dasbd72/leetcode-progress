import { useState } from 'react';

import { type IntervalKey, useProgressQuery } from '@/api/progress';
import { KpiTiles } from '@/components/dashboard/KpiTiles';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { Panel, PanelTitle } from '@/components/ui/panel';
import { computeKpis } from '@/lib/progress';

export function Dashboard() {
  const [interval, setInterval] = useState<IntervalKey>('day');
  const query = useProgressQuery(interval);

  return (
    <div className="grid gap-[14px]">
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
          <Panel>
            <PanelTitle>Leaderboard</PanelTitle>
            <p className="text-muted mt-2 text-sm">Leaderboard coming soon.</p>
          </Panel>
        </>
      )}
    </div>
  );
}
