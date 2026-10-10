import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Dashboard } from '@/routes/Dashboard';
import { type IntervalResponse } from '@/lib/progress';
import { fakeAuth, renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

const response: IntervalResponse = {
  usernames: ['alice', 'bob'],
  data: {
    '1000': {
      alice: { easy: 10, medium: 5, hard: 1, total: 16 },
      bob: { easy: 20, medium: 10, hard: 2, total: 32 },
    },
    '2000': {
      alice: { easy: 12, medium: 6, hard: 2, total: 20 },
      bob: { easy: 21, medium: 10, hard: 2, total: 33 },
    },
  },
};

function mockProgress(body: IntervalResponse = response) {
  server.use(
    http.get('http://localhost:8000/progress/latest/interval', () => HttpResponse.json(body)),
  );
}

describe('Dashboard', () => {
  it('renders KPI aggregates from the fetched progress data', async () => {
    mockProgress();
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });

    // Total solved = last totals 20 + 33 = 53.
    expect(await screen.findByText('53')).toBeInTheDocument();
    // Solved in range = gains (20-16) + (33-32) = 5.
    expect(screen.getByText('+5')).toBeInTheDocument();
    // Top climber = alice (+4) — the KPI sub-label is unambiguous.
    expect(screen.getByText('+4 problems')).toBeInTheDocument();
  });

  it('shows a chip per solver and metric controls', async () => {
    mockProgress();
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });

    await screen.findByText('53');
    expect(screen.getByRole('group', { name: 'Metric' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Score' })).toBeInTheDocument();
    // Mode control offers Cumulative / Gain / Diff.
    expect(screen.getByRole('button', { name: 'Diff' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alice/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bob/ })).toBeInTheDocument();
  });

  it('toggles a solver series off via its chip', async () => {
    mockProgress();
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });
    await screen.findByText('53');

    const aliceChip = screen.getByRole('button', { name: /alice/ });
    expect(aliceChip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(aliceChip);
    expect(aliceChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the leaderboard ranked by score with latest stats', async () => {
    mockProgress();
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });
    await screen.findByText('53');

    // bob score = 21 + 20 + 6 = 47; alice = 12 + 12 + 6 = 30.
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();

    // bob ranks first (higher score). Data rows live in the table body.
    const table = screen.getByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1); // drop header
    expect(within(bodyRows[0]).getByText('bob')).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText('alice')).toBeInTheDocument();
  });

  it('hides the audience toggle for logged-out visitors', async () => {
    mockProgress();
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });

    await screen.findByText('53');
    expect(screen.queryByRole('group', { name: 'Audience' })).not.toBeInTheDocument();
  });

  it('switches to the following-only feed when toggled while logged in', async () => {
    mockProgress();
    const followingResponse: IntervalResponse = {
      usernames: ['alice'],
      data: {
        '1000': { alice: { easy: 10, medium: 5, hard: 1, total: 16 } },
        '2000': { alice: { easy: 12, medium: 6, hard: 2, total: 20 } },
      },
    };
    server.use(
      http.get('http://localhost:8000/auth/progress/latest/interval', () =>
        HttpResponse.json(followingResponse),
      ),
    );
    renderWithProviders(<Dashboard />, { authValue: fakeAuth({ isAuthenticated: true }) });

    await screen.findByText('53');
    await userEvent.click(screen.getByRole('button', { name: 'Following' }));

    // Total solved drops to alice's total (20) once following-only data loads.
    const summary = screen.getByRole('region', { name: 'Summary' });
    await waitFor(() => expect(within(summary).getByText('20')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /bob/ })).not.toBeInTheDocument();
  });

  it('renders an error state when the request fails', async () => {
    server.use(
      http.get(
        'http://localhost:8000/progress/latest/interval',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    renderWithProviders(<Dashboard />, { authValue: fakeAuth() });

    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });
});
