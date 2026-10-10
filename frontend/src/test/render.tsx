import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { AuthContext, type AuthContextProps, AuthProvider } from 'react-oidc-context';
import { MemoryRouter } from 'react-router-dom';

import { oidcConfig } from '@/auth/oidcConfig';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  /** Inject a fake auth context (e.g. an authenticated user) instead of the
   *  real AuthProvider, for tests that need a specific auth state. */
  authValue?: AuthContextProps;
}

/** Render a component inside the app's providers (theme, auth, query, router). */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', authValue, ...options }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Auth({ children }: { children: ReactNode }) {
    if (authValue) return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
    return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <Auth>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </QueryClientProvider>
        </Auth>
      </ThemeProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

/** Minimal fake auth context for tests. */
export function fakeAuth(overrides: Partial<AuthContextProps> = {}): AuthContextProps {
  return {
    isAuthenticated: false,
    isLoading: false,
    user: undefined,
    activeNavigator: undefined,
    error: undefined,
    settings: {} as AuthContextProps['settings'],
    events: {} as AuthContextProps['events'],
    signinRedirect: async () => {},
    signinResourceOwnerCredentials: async () => undefined as never,
    signinPopup: async () => undefined as never,
    signinSilent: async () => null,
    signoutRedirect: async () => {},
    signoutPopup: async () => {},
    signoutSilent: async () => {},
    removeUser: async () => {},
    querySessionStatus: async () => null,
    revokeTokens: async () => {},
    startSilentRenew: () => {},
    stopSilentRenew: () => {},
    clearStaleState: async () => {},
    ...overrides,
  };
}
