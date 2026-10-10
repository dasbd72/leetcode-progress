import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';
import { renderWithProviders } from '@/test/render';

describe('App shell', () => {
  it('renders the dashboard at the index route', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByRole('heading', { name: /leetcode progress/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders the settings route', () => {
    renderWithProviders(<App />, { route: '/settings' });
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });
});
