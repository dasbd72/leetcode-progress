import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Settings } from '@/routes/Settings';
import { fakeAuth, renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://localhost:8000';

const users = [
  { username: 'u-alice', preferred_username: 'Alice', leetcode_username: 'alice_lc' },
  { username: 'u-bob', preferred_username: 'Bob', leetcode_username: 'bob_lc' },
];

function mockUserApis(following: string[] = []) {
  server.use(
    http.get(`${API}/auth/user/list`, () => HttpResponse.json(users)),
    http.get(`${API}/auth/user/following/list`, () => HttpResponse.json(following)),
    http.get(`${API}/auth/user/settings`, () =>
      HttpResponse.json({
        username: 'u-alice',
        email: 'alice@example.com',
        preferred_username: 'Alice',
        leetcode_username: 'alice_lc',
      }),
    ),
  );
}

function render() {
  return renderWithProviders(<Settings />, {
    route: '/settings',
    authValue: fakeAuth({ isAuthenticated: true }),
  });
}

describe('Settings — profile', () => {
  it('loads the profile and saves edits via PUT', async () => {
    mockUserApis();
    let putBody: unknown;
    server.use(
      http.put(`${API}/auth/user/settings`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(putBody as Record<string, unknown> | unknown[]);
      }),
    );
    render();

    const email = await screen.findByDisplayValue('alice@example.com');
    await userEvent.clear(email);
    await userEvent.type(email, 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(putBody).toMatchObject({ email: 'new@example.com', username: 'u-alice' });
  });
});

describe('Settings — following', () => {
  it('selects all followed users and saves the list via PUT', async () => {
    mockUserApis(['u-alice']);
    let putBody: unknown;
    server.use(
      http.put(`${API}/auth/user/following/list`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(putBody as Record<string, unknown> | unknown[]);
      }),
    );
    render();

    await userEvent.click(screen.getByRole('tab', { name: 'Following' }));

    // Pre-checked from the following list.
    const alice = await screen.findByRole('checkbox', { name: /alice/i });
    expect(alice).toBeChecked();
    const bob = screen.getByRole('checkbox', { name: /bob/i });
    expect(bob).not.toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(bob).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Save following' }));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(putBody).toEqual(['u-alice', 'u-bob']);
  });

  it('deselects all and saves an empty list', async () => {
    mockUserApis(['u-alice', 'u-bob']);
    let putBody: unknown;
    server.use(
      http.put(`${API}/auth/user/following/list`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(putBody as Record<string, unknown> | unknown[]);
      }),
    );
    render();

    await userEvent.click(screen.getByRole('tab', { name: 'Following' }));
    await screen.findByRole('checkbox', { name: /alice/i });
    await userEvent.click(screen.getByRole('button', { name: 'Deselect all' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save following' }));

    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(putBody).toEqual([]);
  });
});
