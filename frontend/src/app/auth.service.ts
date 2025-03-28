import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { OidcSecurityService } from 'angular-auth-oidc-client';

export interface AuthData {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use BehaviorSubjects to store the latest authentication and user data
  private authDataSubject = new BehaviorSubject<AuthData>({
    isAuthenticated: false,
    userData: null,
    accessToken: '',
  });

  constructor(private readonly oidcSecurityService: OidcSecurityService) {
    // Subscribe to the OIDC service to get the latest authentication and user data
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData }) => {
      this.authDataSubject.next({
        ...this.authDataSubject.value,
        isAuthenticated,
        userData,
      });
      this.updateAccessToken();
    });
  }

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

  private updateAccessToken(): void {
    this.oidcSecurityService.getAccessToken().subscribe((accessToken) => {
      this.authDataSubject.next({
        ...this.authDataSubject.value,
        accessToken,
      });
    });
  }
}
