import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authConfig } from './auth/auth.config';
import { LocalSecurityStorage } from './auth/local-security-storage';
import { AbstractSecurityStorage, provideAuth } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAuth(authConfig),
    provideHttpClient(),
    { provide: AbstractSecurityStorage, useClass: LocalSecurityStorage },
  ],
};
