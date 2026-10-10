import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '@/api/useApiClient';
import { type IntervalResponse } from '@/lib/progress';

export type IntervalKey = 'hour' | 'day';

export const INTERVALS: Record<IntervalKey, { label: string; hours: number; limit: number }> = {
  hour: { label: 'Hour', hours: 1, limit: 48 },
  day: { label: 'Day', hours: 24, limit: 24 },
};

/** Fetch the public interval progress series for the given interval. */
export function useProgressQuery(interval: IntervalKey) {
  const client = useApiClient();
  const { hours, limit } = INTERVALS[interval];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return useQuery({
    queryKey: ['progress', 'interval', interval],
    queryFn: () =>
      client.get<IntervalResponse>(
        `/progress/latest/interval?hours=${hours}&limit=${limit}&timezone=${encodeURIComponent(timezone)}`,
      ),
  });
}
