import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '@/api/useApiClient';

export interface Announcement {
  title: string;
  content: string;
  date: string;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
}

export function useAnnouncements() {
  const client = useApiClient();
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await client.get<AnnouncementsResponse>('/announcements');
      return res.announcements ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
