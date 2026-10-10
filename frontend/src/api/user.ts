import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '@/api/useApiClient';

export interface User {
  username: string;
  preferred_username: string;
  leetcode_username: string;
}

export interface UserSettings {
  username: string;
  email: string;
  preferred_username: string;
  leetcode_username: string;
}

export function useUserList() {
  const client = useApiClient();
  return useQuery({
    queryKey: ['user', 'list'],
    queryFn: () => client.get<User[]>('/auth/user/list'),
  });
}

export function useUserSettings() {
  const client = useApiClient();
  return useQuery({
    queryKey: ['user', 'settings'],
    queryFn: () => client.get<UserSettings>('/auth/user/settings'),
  });
}

export function useUpdateUserSettings() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: UserSettings) =>
      client.put<UserSettings>('/auth/user/settings', settings),
    onSuccess: (data) => qc.setQueryData(['user', 'settings'], data),
  });
}

export function useFollowing() {
  const client = useApiClient();
  return useQuery({
    queryKey: ['user', 'following'],
    queryFn: () => client.get<string[]>('/auth/user/following/list'),
  });
}

export function useUpdateFollowing() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (list: string[]) => client.put<string[]>('/auth/user/following/list', list),
    onSuccess: (data) => qc.setQueryData(['user', 'following'], data),
  });
}
