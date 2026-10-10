import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Outlet, useNavigate } from 'react-router-dom';

import { takeReturnTo } from '@/auth/authActions';
import { Navbar } from '@/components/layout/Navbar';

/** After a successful sign-in redirect, return the user to where they started. */
function useAuthReturn() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.isAuthenticated) {
      const returnTo = takeReturnTo();
      if (returnTo) navigate(returnTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);
}

export function AppLayout() {
  useAuthReturn();
  return (
    <div className="bg-bg text-fg min-h-dvh">
      <Navbar />
      <main className="mx-auto w-full max-w-[1080px] px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
