import { screen, waitFor } from '@testing-library/react';
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
