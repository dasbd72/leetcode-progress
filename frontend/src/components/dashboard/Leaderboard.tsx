import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Panel, PanelTitle } from '@/components/ui/panel';
import { userColor } from '@/lib/colors';
import { type LeaderboardRow, toLeaderboard, type IntervalResponse } from '@/lib/progress';
import { cn } from '@/lib/utils';

function Sparkline({ row }: { row: LeaderboardRow }) {
  return (
    <LineChart
      width={84}
      height={24}
      data={row.spark}
      margin={{ top: 3, right: 2, bottom: 3, left: 2 }}
    >
      <Line
        type="monotone"
        dataKey="v"
        stroke={userColor(row.colorIndex)}
        strokeWidth={1.6}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}

function MixBar({ row }: { row: LeaderboardRow }) {
  const data = [{ name: row.username, easy: row.easy, medium: row.medium, hard: row.hard }];
  return (
    <BarChart width={120} height={8} layout="vertical" data={data} barCategoryGap={0}>
      <XAxis type="number" hide domain={[0, 'dataMax']} />
      <YAxis type="category" dataKey="name" hide />
      <Bar dataKey="easy" stackId="mix" fill="var(--easy)" isAnimationActive={false} />
      <Bar dataKey="medium" stackId="mix" fill="var(--med)" isAnimationActive={false} />
      <Bar dataKey="hard" stackId="mix" fill="var(--hard)" isAnimationActive={false} />
    </BarChart>
  );
}

const th =
  'text-muted border-line border-b px-2.5 py-2 text-right text-[11px] font-semibold tracking-[0.07em] uppercase whitespace-nowrap';
const td = 'tabular border-line border-b px-2.5 py-2.5 text-right whitespace-nowrap';

export function Leaderboard({ data }: { data: IntervalResponse }) {
  const rows = toLeaderboard(data);
  return (
    <Panel>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <PanelTitle>Leaderboard</PanelTitle>
        <span className="tabular text-muted text-xs">Score = Easy × 1 + Medium × 2 + Hard × 3</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={cn(th, 'w-8 text-left')}>#</th>
              <th className={cn(th, 'text-left')}>Solver</th>
              <th className={th}>Easy</th>
              <th className={th}>Medium</th>
              <th className={th}>Hard</th>
              <th className={th}>Total</th>
              <th className={th}>Score</th>
              <th className={th}>Gain</th>
              <th className={th}>Trend</th>
              <th className={th}>Mix</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rank) => (
              <tr key={row.username}>
                <td className={cn(td, 'text-muted text-left')}>{rank + 1}</td>
                <td className={cn(td, 'text-fg text-left font-sans font-semibold')}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: userColor(row.colorIndex) }}
                    />
                    {row.username}
                  </span>
                </td>
                <td className={td}>{row.easy}</td>
                <td className={td}>{row.medium}</td>
                <td className={td}>{row.hard}</td>
                <td className={cn(td, 'font-bold')}>{row.total}</td>
                <td className={td}>{row.score}</td>
                <td className={cn(td, 'text-accent')}>+{row.gain}</td>
                <td className={cn(td, 'text-right')}>
                  <span className="inline-flex justify-end">
                    <Sparkline row={row} />
                  </span>
                </td>
                <td className={cn(td, 'text-right')}>
                  <span className="inline-flex justify-end">
                    <MixBar row={row} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
