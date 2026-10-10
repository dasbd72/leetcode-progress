import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';

import { createApiClient } from '@/api/client';
import { env } from '@/config/env';

/** API client bound to the current Cognito access token. */
export function useApiClient() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  return useMemo(
    () => createApiClient({ baseUrl: env.apiBaseUrl, getAccessToken: () => token }),
    [token],
  );
}
