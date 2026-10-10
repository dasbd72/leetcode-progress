import { Panel, PanelTitle } from '@/components/ui/panel';

/**
 * Dashboard shell. KPI tiles + time-series chart (F3) and the leaderboard
 * table (F4) land in these panels; this is the walking-skeleton placeholder.
 */
export function Dashboard() {
  return (
    <div className="grid gap-[14px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[26px] leading-none font-semibold -tracking-[0.01em]">
          LeetCode progress
        </h1>
        <p className="tabular text-muted text-xs">snapshot every 20 min</p>
      </div>
      <Panel>
        <PanelTitle>Progress over time</PanelTitle>
        <p className="text-muted mt-2 text-sm">Chart coming soon.</p>
      </Panel>
      <Panel>
        <PanelTitle>Leaderboard</PanelTitle>
        <p className="text-muted mt-2 text-sm">Leaderboard coming soon.</p>
      </Panel>
    </div>
  );
}
