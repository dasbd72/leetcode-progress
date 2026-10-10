import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client. Server state (progress, users, announcements)
 *  is cached here; sensible defaults keep the dashboard snappy on revisit. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
