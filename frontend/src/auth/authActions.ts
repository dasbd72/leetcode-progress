import { type AuthContextProps } from 'react-oidc-context';

const RETURN_TO_KEY = 'returnTo';

/** Begin the Cognito sign-in redirect, remembering where to land afterwards. */
export function signIn(auth: AuthContextProps, returnTo = '/settings') {
  sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  void auth.signinRedirect();
}

/**
 * Sign out. Prefer the OIDC end-session redirect (full Cognito logout); fall
 * back to clearing the local session if no end-session endpoint is available.
 */
export async function signOut(auth: AuthContextProps) {
  try {
    await auth.signoutRedirect();
  } catch {
    await auth.removeUser();
    window.location.assign(window.location.origin);
  }
}

export function takeReturnTo(): string | null {
  const value = sessionStorage.getItem(RETURN_TO_KEY);
  if (value) sessionStorage.removeItem(RETURN_TO_KEY);
  return value;
}
