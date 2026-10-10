import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { fakeAuth, renderWithProviders } from '@/test/render';

describe('App shell', () => {
  it('renders the dashboard at the index route (public)', () => {
    renderWithProviders(<App />, { route: '/', authValue: fakeAuth() });
    expect(screen.getByRole('heading', { name: /leetcode progress/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('hides the Settings link and shows Sign in when logged out', () => {
    renderWithProviders(<App />, { route: '/', authValue: fakeAuth() });
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows the Settings link and Sign out when authenticated', () => {
    renderWithProviders(<App />, { route: '/', authValue: fakeAuth({ isAuthenticated: true }) });
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});

describe('settings guard', () => {
  it('redirects to sign-in when visiting /settings logged out', () => {
    const signinRedirect = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<App />, {
      route: '/settings',
      authValue: fakeAuth({ signinRedirect }),
    });
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(signinRedirect).toHaveBeenCalled();
  });

  it('renders settings when authenticated', () => {
    renderWithProviders(<App />, {
      route: '/settings',
      authValue: fakeAuth({ isAuthenticated: true }),
    });
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });
});
