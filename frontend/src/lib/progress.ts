export type Metric = 'total' | 'easy' | 'medium' | 'hard' | 'score';
export type ChartMode = 'cumulative' | 'gain';

export interface RawStat {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

/** Response shape of GET /progress/latest/interval. */
export interface IntervalResponse {
  data: Record<string, Record<string, RawStat>>;
  usernames: string[];
}

export const METRICS: { value: Metric; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'score', label: 'Score' },
];

/** Score = Easy × 1 + Medium × 2 + Hard × 3. */
export function score(s: RawStat): number {
  return s.easy + 2 * s.medium + 3 * s.hard;
}

export function metricValue(s: RawStat, metric: Metric): number {
  switch (metric) {
    case 'score':
      return score(s);
    case 'total':
      return s.total;
    default:
      return s[metric];
  }
}

/** Timestamp→row map sorted ascending by (numeric) timestamp. */
function sortedEntries(res: IntervalResponse) {
  return Object.entries(res.data)
    .map(([ts, row]) => [Number(ts), row] as const)
    .sort((a, b) => a[0] - b[0]);
}

export interface ChartPoint {
  /** epoch milliseconds */
  t: number;
  [username: string]: number;
}

/**
 * Build Recharts series points for a metric. In `gain` mode each user's values
 * are offset by their first in-range value, so lines start at 0 and show
 * problems solved during the window.
 */
export function toSeries(
  res: IntervalResponse,
  metric: Metric,
  mode: ChartMode,
): { points: ChartPoint[]; usernames: string[] } {
  const entries = sortedEntries(res);
  const baseline: Record<string, number> = {};
  if (mode === 'gain' && entries.length) {
    const [, firstRow] = entries[0];
    for (const u of res.usernames) {
      baseline[u] = firstRow[u] ? metricValue(firstRow[u], metric) : 0;
    }
  }
  const points = entries.map(([t, row]) => {
    const point: ChartPoint = { t: t * 1000 };
    for (const u of res.usernames) {
      const stat = row[u];
      if (!stat) continue;
      const value = metricValue(stat, metric);
      point[u] = mode === 'gain' ? value - (baseline[u] ?? 0) : value;
    }
    return point;
  });
  return { points, usernames: res.usernames };
}

export interface Kpis {
  totalSolved: number;
  solvedInRange: number;
  hardInRange: number;
  topClimber: { username: string; gain: number } | null;
}

/** Headline aggregates over the range: totals from the last snapshot, gains
 *  measured against the first snapshot in range. */
export function computeKpis(res: IntervalResponse): Kpis {
  const entries = sortedEntries(res);
  if (!entries.length) {
    return { totalSolved: 0, solvedInRange: 0, hardInRange: 0, topClimber: null };
  }
  const firstRow = entries[0][1];
  const lastRow = entries[entries.length - 1][1];

  let totalSolved = 0;
  let solvedInRange = 0;
  let hardInRange = 0;
  let topClimber: Kpis['topClimber'] = null;

  for (const u of res.usernames) {
    const last = lastRow[u];
    if (!last) continue;
    const first = firstRow[u];
    totalSolved += last.total;
    const gain = last.total - (first?.total ?? last.total);
    hardInRange += last.hard - (first?.hard ?? last.hard);
    solvedInRange += gain;
    if (!topClimber || gain > topClimber.gain) topClimber = { username: u, gain };
  }
  return { totalSolved, solvedInRange, hardInRange, topClimber };
}

export interface LeaderboardRow {
  username: string;
  /** Index in the original usernames order — keeps colors consistent with the chart. */
  colorIndex: number;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  score: number;
  /** Total gain over the range. */
  gain: number;
  /** Total-solved trend over the range (for the sparkline). */
  spark: { t: number; v: number }[];
}

/** Build leaderboard rows from the latest snapshot, ranked by Score (desc). */
export function toLeaderboard(res: IntervalResponse): LeaderboardRow[] {
  const entries = sortedEntries(res);
  if (!entries.length) return [];
  const firstRow = entries[0][1];
  const lastRow = entries[entries.length - 1][1];

  const rows: LeaderboardRow[] = [];
  res.usernames.forEach((username, colorIndex) => {
    const last = lastRow[username];
    if (!last) return;
    const first = firstRow[username];
    rows.push({
      username,
      colorIndex,
      easy: last.easy,
      medium: last.medium,
      hard: last.hard,
      total: last.total,
      score: score(last),
      gain: last.total - (first?.total ?? last.total),
      spark: entries.map(([t, row]) => ({ t: t * 1000, v: row[username]?.total ?? 0 })),
    });
  });

  rows.sort((a, b) => b.score - a.score);
  return rows;
}
