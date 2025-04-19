import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { OidcSecurityService } from 'angular-auth-oidc-client';

export interface AuthData {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authDataSubject = new BehaviorSubject<AuthData>({
    isAuthenticated: false,
    userData: null,
    accessToken: '',
    isLoading: true,
  });

  constructor(private readonly oidcSecurityService: OidcSecurityService) {
    this.oidcSecurityService.isAuthenticated$.subscribe((isAuthenticatedResult) => {
      this.authDataSubject.next({
        ...this.authDataSubject.value,
        isAuthenticated: isAuthenticatedResult.isAuthenticated,
        isLoading: false,
      });
    });
    this.oidcSecurityService
      .checkAuth()
      .pipe(
        tap(({ isAuthenticated, userData }) => {
          this.authDataSubject.next({
            ...this.authDataSubject.value,
            isAuthenticated,
            userData,
            isLoading: false,
          });
        }),
        switchMap(() => this.oidcSecurityService.getAccessToken()),
        tap((accessToken) => {
          this.authDataSubject.next({
            ...this.authDataSubject.value,
            accessToken,
          });
        }),
        catchError((error) => {
          console.error('Authentication error:', error);
          this.authDataSubject.next({
            ...this.authDataSubject.value,
            isLoading: false,
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  get authData$(): Observable<AuthData> {
    return this.authDataSubject.asObservable();
  }

  login(): void {
    this.oidcSecurityService.authorize();
  }

  logout(): void {
    this.oidcSecurityService
      .logoff()
      .pipe(
        tap((result) => console.log('Logged off:', result)),
        catchError((error) => {
          console.error('Logout error:', error);
          return of(null);
        }),
      )
      .subscribe();
  }
}
