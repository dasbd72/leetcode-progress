export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current Cognito access token, if the user is signed in. */
  getAccessToken?: () => string | undefined;
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Thin fetch wrapper. Attaches the Cognito access token as a Bearer header when
 * available (the backend's `/auth/...` routes require it; public routes ignore
 * it) and parses JSON responses.
 */
export function createApiClient({ baseUrl, getAccessToken }: ApiClientOptions) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const token = getAccessToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      throw new ApiError(res.status, `Request to ${path} failed with ${res.status}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'POST',
        body: body == null ? undefined : JSON.stringify(body),
      }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'PUT',
        body: body == null ? undefined : JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'DELETE' }),
  };
}
