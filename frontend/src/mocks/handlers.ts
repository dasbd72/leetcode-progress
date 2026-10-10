import { http, HttpResponse, type RequestHandler } from 'msw';

const API = 'http://localhost:8000';

/**
 * Default MSW request handlers — benign empty responses so components that
 * fetch on mount don't trip the unhandled-request guard. Individual tests
 * override these with `server.use(...)` for specific scenarios.
 */
export const handlers: RequestHandler[] = [
  http.get(`${API}/progress/latest/interval`, () => HttpResponse.json({ data: {}, usernames: [] })),
  http.get(`${API}/auth/user/list`, () => HttpResponse.json([])),
  http.get(`${API}/auth/user/following/list`, () => HttpResponse.json([])),
  http.get(`${API}/auth/user/settings`, () =>
    HttpResponse.json({ username: '', email: '', preferred_username: '', leetcode_username: '' }),
  ),
  http.get(`${API}/announcements`, () => HttpResponse.json({ announcements: [] })),
];
