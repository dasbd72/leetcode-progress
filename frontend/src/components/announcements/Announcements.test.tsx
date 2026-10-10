import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Announcements } from '@/components/announcements/Announcements';
import { fakeAuth, renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://localhost:8000';

function mockAnnouncements() {
  server.use(
    http.get(`${API}/announcements`, () =>
      HttpResponse.json({
        announcements: [
          { title: 'Follow users', content: 'line one\nline two', date: '2030-01-01' },
        ],
      }),
    ),
  );
}

describe('Announcements', () => {
  it('surfaces unseen announcements in a modal', async () => {
    mockAnnouncements();
    renderWithProviders(<Announcements />, { authValue: fakeAuth() });

    expect(await screen.findByText('Follow users')).toBeInTheDocument();
    expect(screen.getByText(/line one/)).toBeInTheDocument();
  });

  it('records the latest date on dismiss and closes', async () => {
    mockAnnouncements();
    renderWithProviders(<Announcements />, { authValue: fakeAuth() });

    await screen.findByText('Follow users');
    await userEvent.click(screen.getByRole('button', { name: /close announcements/i }));

    await waitFor(() => expect(screen.queryByText('Follow users')).not.toBeInTheDocument());
    expect(localStorage.getItem('announcements:lastSeen')).toBe('2030-01-01');
  });

  it('stays closed when the latest announcement was already seen', async () => {
    localStorage.setItem('announcements:lastSeen', '2030-01-01');
    mockAnnouncements();
    renderWithProviders(<Announcements />, { authValue: fakeAuth() });

    // Give the query time to resolve, then assert nothing opened.
    await waitFor(() => expect(localStorage.getItem('announcements:lastSeen')).toBe('2030-01-01'));
    expect(screen.queryByText('Follow users')).not.toBeInTheDocument();
  });
});
