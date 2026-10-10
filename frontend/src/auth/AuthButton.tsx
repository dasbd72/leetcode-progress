import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

import { signIn, signOut } from '@/auth/authActions';
import { Button } from '@/components/ui/button';

/** Header auth control: Sign in when logged out, identity + Sign out when in. */
export function AuthButton() {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    const name =
      (auth.user?.profile.preferred_username as string | undefined) ??
      auth.user?.profile.email ??
      'Account';
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted hidden text-sm sm:inline">{name}</span>
        <Button variant="outline" size="sm" onClick={() => void signOut(auth)}>
          <LogOut />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => signIn(auth)} disabled={auth.isLoading}>
      <LogIn />
      Sign in
    </Button>
  );
}
