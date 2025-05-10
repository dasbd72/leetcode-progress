import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface User {
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
}

export interface UserSettings {
  email: string;
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
}

export const DefaultUserSettings: UserSettings = {
  email: '',
  username: '',
  preferredUsername: '',
  leetcodeUsername: '',
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSettingsSubject = new BehaviorSubject<UserSettings>(DefaultUserSettings);

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  private convertUserToCamelCase(obj: any): User {
    return {
      username: obj.username,
      preferredUsername: obj.preferred_username,
      leetcodeUsername: obj.leetcode_username,
    };
  }

  private fetchUserList(accessToken: string): Observable<User[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<any>(`${environment.apiBaseUrl}/user/list`, { headers }).pipe(
      map((data) => data.map((user: any) => this.convertUserToCamelCase(user))),
      catchError((error) => {
        console.error('Failed to fetch user list:', error);
        return of([]);
      }),
    );
  }

  getUserList(): Observable<User[]> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => this.fetchUserList(authData.accessToken)),
    );
  }

  private convertUserSettingsToCamelCase(obj: any): UserSettings {
    return {
      email: obj.email,
      username: obj.username,
      preferredUsername: obj.preferred_username,
      leetcodeUsername: obj.leetcode_username,
    };
  }

  private convertUserSettingsToUnderscoreCase(settings: UserSettings): any {
    return {
      email: settings.email,
      username: settings.username,
      preferred_username: settings.preferredUsername,
      leetcode_username: settings.leetcodeUsername,
    };
  }

  private fetchUserSettings(accessToken: string): Observable<UserSettings> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<any>(`${environment.apiBaseUrl}/user/settings`, { headers }).pipe(
      map((data) => this.convertUserSettingsToCamelCase(data)),
      tap((settings) => this.userSettingsSubject.next(settings)),
      catchError((error) => {
        console.error('Failed to fetch settings:', error);
        return of(DefaultUserSettings);
      }),
    );
  }

  getUserSettings(): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => this.fetchUserSettings(authData.accessToken)),
    );
  }

  private updateUserSettingsRequest(
    accessToken: string,
    userSettings: UserSettings,
  ): Observable<UserSettings> {
    const underscoredSettings = this.convertUserSettingsToUnderscoreCase(userSettings);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .put<any>(`${environment.apiBaseUrl}/user/settings`, underscoredSettings, { headers })
      .pipe(
        map((data) => this.convertUserSettingsToCamelCase(data)),
        tap((settings) => this.userSettingsSubject.next(settings)),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          return of(userSettings);
        }),
      );
  }

  updateUserSettings(userSettings: UserSettings): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => this.updateUserSettingsRequest(authData.accessToken, userSettings)),
    );
  }

  private fetchUserSubscriptionList(accessToken: string): Observable<string[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<any>(`${environment.apiBaseUrl}/user/subscription/list`, { headers }).pipe(
      catchError((error) => {
        console.error('Failed to fetch subscriptions:', error);
        return of([]);
      }),
    );
  }

  getUserSubscriptionList(): Observable<string[]> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => this.fetchUserSubscriptionList(authData.accessToken)),
    );
  }

  private updateUserSubscriptionListRequest(
    accessToken: string,
    subscriptionList: string[],
  ): Observable<string[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .put<any>(`${environment.apiBaseUrl}/user/subscription/list`, subscriptionList, {
        headers,
      })
      .pipe(
        catchError((error) => {
          console.error('Failed to update subscriptions:', error);
          return of([]);
        }),
      );
  }

  updateUserSubscriptionList(subscriptionList: string[]): Observable<string[]> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) =>
        this.updateUserSubscriptionListRequest(authData.accessToken, subscriptionList),
      ),
    );
  }
}
