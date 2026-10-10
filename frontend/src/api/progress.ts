import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '@/api/useApiClient';
import { type IntervalResponse } from '@/lib/progress';

export type IntervalKey = 'hour' | 'day';
/** 'all' = every user; 'following' = caller + whoever they follow (requires auth). */
export type Audience = 'all' | 'following';

export const INTERVALS: Record<IntervalKey, { label: string; hours: number; limit: number }> = {
  hour: { label: 'Hour', hours: 1, limit: 48 },
  day: { label: 'Day', hours: 24, limit: 24 },
};

/** Fetch the interval progress series for the given interval and audience. */
export function useProgressQuery(interval: IntervalKey, audience: Audience = 'all') {
  const client = useApiClient();
  const { hours, limit } = INTERVALS[interval];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const path =
    audience === 'following' ? '/auth/progress/latest/interval' : '/progress/latest/interval';

  return useQuery({
    queryKey: ['progress', 'interval', interval, audience],
    queryFn: () =>
      client.get<IntervalResponse>(
        `${path}?hours=${hours}&limit=${limit}&timezone=${encodeURIComponent(timezone)}`,
      ),
  });
}
