import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError, createApiClient } from '@/api/client';
import { server } from '@/test/server';

const BASE = 'https://api.test';

describe('api client', () => {
  it('attaches the Cognito access token as a Bearer header', async () => {
    let authHeader: string | null = null;
    server.use(
      http.get(`${BASE}/auth/user/list`, ({ request }) => {
        authHeader = request.headers.get('authorization');
        return HttpResponse.json([]);
      }),
    );
    const client = createApiClient({ baseUrl: BASE, getAccessToken: () => 'test-token' });

    await client.get('/auth/user/list');

    expect(authHeader).toBe('Bearer test-token');
  });

  it('omits the Authorization header when there is no token', async () => {
    let hasAuth = true;
    server.use(
      http.get(`${BASE}/progress/latest`, ({ request }) => {
        hasAuth = request.headers.has('authorization');
        return HttpResponse.json({});
      }),
    );
    const client = createApiClient({ baseUrl: BASE, getAccessToken: () => undefined });

    await client.get('/progress/latest');

    expect(hasAuth).toBe(false);
  });

  it('throws ApiError on a non-ok response', async () => {
    server.use(http.get(`${BASE}/auth/user/list`, () => new HttpResponse(null, { status: 401 })));
    const client = createApiClient({ baseUrl: BASE });

    await expect(client.get('/auth/user/list')).rejects.toBeInstanceOf(ApiError);
  });
});
