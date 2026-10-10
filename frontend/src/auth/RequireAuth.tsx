import { type ReactNode, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router-dom';

import { signIn } from '@/auth/authActions';

/** Route guard: redirects unauthenticated users into the Cognito sign-in flow. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error) {
      signIn(auth, location.pathname);
    }
  }, [
    auth,
    auth.isLoading,
    auth.isAuthenticated,
    auth.activeNavigator,
    auth.error,
    location.pathname,
  ]);

  if (auth.isAuthenticated) return <>{children}</>;

  return (
    <p className="text-muted py-10 text-center text-sm">
      {auth.error ? `Sign-in failed: ${auth.error.message}` : 'Signing in…'}
    </p>
  );
}
