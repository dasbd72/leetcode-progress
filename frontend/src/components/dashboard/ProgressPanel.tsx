import { useMemo, useState } from 'react';

import { INTERVALS, type IntervalKey } from '@/api/progress';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { UserChips } from '@/components/dashboard/UserChips';
import { Panel, PanelTitle } from '@/components/ui/panel';
import { SegmentedControl } from '@/components/ui/segmented';
import {
  type ChartMode,
  type IntervalResponse,
  METRICS,
  type Metric,
  toSeries,
} from '@/lib/progress';

const MODES: { value: ChartMode; label: string }[] = [
  { value: 'cumulative', label: 'Cumulative' },
  { value: 'gain', label: 'Gain' },
];

const INTERVAL_OPTIONS = (Object.keys(INTERVALS) as IntervalKey[]).map((k) => ({
  value: k,
  label: INTERVALS[k].label,
}));

interface ProgressPanelProps {
  data: IntervalResponse;
  interval: IntervalKey;
  onIntervalChange: (interval: IntervalKey) => void;
}

export function ProgressPanel({ data, interval, onIntervalChange }: ProgressPanelProps) {
  const [metric, setMetric] = useState<Metric>('total');
  const [mode, setMode] = useState<ChartMode>('cumulative');
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { points } = useMemo(() => toSeries(data, metric, mode), [data, metric, mode]);

  function toggle(username: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  return (
    <Panel>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <PanelTitle>Progress over time</PanelTitle>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl
            aria-label="Metric"
            options={METRICS}
            value={metric}
            onChange={setMetric}
          />
          <SegmentedControl
            aria-label="Interval"
            options={INTERVAL_OPTIONS}
            value={interval}
            onChange={onIntervalChange}
          />
          <SegmentedControl aria-label="Mode" options={MODES} value={mode} onChange={setMode} />
        </div>
      </div>
      <ProgressChart
        points={points}
        usernames={data.usernames}
        hidden={hidden}
        interval={interval}
      />
      <UserChips usernames={data.usernames} hidden={hidden} onToggle={toggle} />
    </Panel>
  );
}
