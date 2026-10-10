import { WebStorageStateStore } from 'oidc-client-ts';
import { type AuthProviderProps } from 'react-oidc-context';

import { env } from '@/config/env';

/**
 * Cognito OIDC configuration (Authorization Code + PKCE with refresh tokens),
 * mapped field-for-field from the old angular-auth-oidc-client setup. Token
 * validation happens at the API Gateway JWT authorizer; the app just obtains a
 * valid token and sends it as a Bearer header.
 */
export const oidcConfig: AuthProviderProps = {
  authority: env.auth.authority,
  client_id: env.auth.clientId,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid email profile aws.cognito.signin.user.admin',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Strip the ?code & ?state params from the URL after the redirect callback.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
