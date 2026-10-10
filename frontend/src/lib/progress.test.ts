import { describe, expect, it } from 'vitest';

import { computeKpis, type IntervalResponse, metricValue, score, toSeries } from '@/lib/progress';

const fixture: IntervalResponse = {
  usernames: ['alice', 'bob'],
  data: {
    '1000': {
      alice: { easy: 10, medium: 5, hard: 1, total: 16 },
      bob: { easy: 20, medium: 10, hard: 2, total: 32 },
    },
    '2000': {
      alice: { easy: 12, medium: 6, hard: 2, total: 20 },
      bob: { easy: 21, medium: 10, hard: 2, total: 33 },
    },
  },
};

describe('score & metricValue', () => {
  it('computes Score = easy + 2*medium + 3*hard', () => {
    expect(score({ easy: 10, medium: 5, hard: 1, total: 16 })).toBe(10 + 10 + 3);
  });

  it('reads the right field per metric', () => {
    const s = { easy: 10, medium: 5, hard: 1, total: 16 };
    expect(metricValue(s, 'total')).toBe(16);
    expect(metricValue(s, 'easy')).toBe(10);
    expect(metricValue(s, 'hard')).toBe(1);
    expect(metricValue(s, 'score')).toBe(23);
  });
});

describe('toSeries', () => {
  it('produces one point per timestamp (ms) with cumulative values', () => {
    const { points } = toSeries(fixture, 'total', 'cumulative');
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ t: 1_000_000, alice: 16, bob: 32 });
    expect(points[1]).toMatchObject({ t: 2_000_000, alice: 20, bob: 33 });
  });

  it('offsets each user from their first value in gain mode', () => {
    const { points } = toSeries(fixture, 'total', 'gain');
    expect(points[0]).toMatchObject({ alice: 0, bob: 0 });
    expect(points[1]).toMatchObject({ alice: 4, bob: 1 });
  });

  it('charts Score correctly', () => {
    const { points } = toSeries(fixture, 'score', 'cumulative');
    // alice@2000: 12 + 2*6 + 3*2 = 30
    expect(points[1].alice).toBe(30);
  });
});

describe('computeKpis', () => {
  it('sums latest totals and gains against the first snapshot', () => {
    const kpis = computeKpis(fixture);
    expect(kpis.totalSolved).toBe(20 + 33);
    expect(kpis.solvedInRange).toBe(4 + 1);
    expect(kpis.hardInRange).toBe(1 + 0);
    expect(kpis.topClimber).toEqual({ username: 'alice', gain: 4 });
  });

  it('is safe on empty data', () => {
    expect(computeKpis({ usernames: [], data: {} })).toEqual({
      totalSolved: 0,
      solvedInRange: 0,
      hardInRange: 0,
      topClimber: null,
    });
  });
});
