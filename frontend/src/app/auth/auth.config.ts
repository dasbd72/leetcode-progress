import { environment } from '../../environments/environment';
import { LogLevel, PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority: environment.auth.authority,
    redirectUrl: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin + '/auth/callback',
    clientId: environment.auth.clientId,
    scope: 'openid email profile aws.cognito.signin.user.admin',
    responseType: 'code',
    silentRenew: false,
    useRefreshToken: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
    logLevel: LogLevel.Debug,
    // Fixes the issue with the logoff function error
    customParamsEndSessionRequest: {
      client_id: environment.auth.clientId,
      logout_uri: window.location.origin + '/auth/callback',
    },
  },
};
