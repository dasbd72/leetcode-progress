import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { OidcSecurityService, UserDataResult } from 'angular-auth-oidc-client';

export type AuthData = {
  isAuthenticated: boolean;
  userData: any;
  preferred_username: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use BehaviorSubjects to store the latest authentication and user data
  private authDataSubject = new BehaviorSubject<AuthData>({
    isAuthenticated: false,
    userData: null,
    preferred_username: '',
  });

  constructor(private readonly oidcSecurityService: OidcSecurityService) {
    // Subscribe to the OIDC service to get the latest authentication and user data
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData }) => {
      const preferred_username = this.extractPreferredUsername(userData);
      this.authDataSubject.next({ isAuthenticated, userData, preferred_username });
    });
    this.oidcSecurityService.userData$.subscribe((userDataResult: UserDataResult) => {
      const userData = userDataResult.userData;
      const preferred_username = this.extractPreferredUsername(userData);
      this.authDataSubject.next({
        isAuthenticated: this.authDataSubject.value.isAuthenticated, // Keep authentication status from the last update
        userData,
        preferred_username,
      });
    });
  }

  // Public Observables to expose the data to other components
  get authData$(): Observable<AuthData> {
    return this.authDataSubject.asObservable();
  }

  // Log in the user
  login(): void {
    this.oidcSecurityService.authorize();
  }

  // Log out the user
  logout(): void {
    this.oidcSecurityService.logoff().subscribe((result) => {
      console.log('Logged off:', result);
    });
  }

  extractPreferredUsername(userData: any): string {
    return userData?.preferred_username ?? userData?.username ?? '';
  }
}
