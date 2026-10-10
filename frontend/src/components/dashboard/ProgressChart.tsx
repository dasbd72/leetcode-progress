import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { type IntervalKey } from '@/api/progress';
import { userColor } from '@/lib/colors';
import { type ChartPoint } from '@/lib/progress';

function formatTick(interval: IntervalKey) {
  return (t: number) => {
    const d = new Date(t);
    const p = (n: number) => String(n).padStart(2, '0');
    return interval === 'hour'
      ? `${p(d.getHours())}:${p(d.getMinutes())}`
      : `${p(d.getMonth() + 1)}/${p(d.getDate())}`;
  };
}

interface TipItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function ChartTooltipBody({
  active,
  payload,
  label,
  interval,
}: {
  active?: boolean;
  payload?: TipItem[];
  label?: number;
  interval: IntervalKey;
}) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="border-line bg-panel tabular rounded-md border p-2.5 text-xs shadow-[var(--shadow-tip)]">
      <div className="mb-1 font-semibold">{formatTick(interval)(Number(label))}</div>
      {rows.map((r) => (
        <div key={String(r.dataKey)} className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.dataKey}
          </span>
          <span>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ProgressChartProps {
  points: ChartPoint[];
  usernames: string[];
  hidden: Set<string>;
  interval: IntervalKey;
}

export function ProgressChart({ points, usernames, hidden, interval }: ProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="t"
          tickFormatter={formatTick(interval)}
          stroke="var(--muted)"
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--line)' }}
          minTickGap={32}
        />
        <YAxis
          stroke="var(--muted)"
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
          content={({ active, payload, label }) => (
            <ChartTooltipBody
              active={active}
              payload={payload as TipItem[] | undefined}
              label={label as number}
              interval={interval}
            />
          )}
        />
        {usernames.map((username, i) =>
          hidden.has(username) ? null : (
            <Line
              key={username}
              type="monotone"
              dataKey={username}
              stroke={userColor(i)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ),
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
