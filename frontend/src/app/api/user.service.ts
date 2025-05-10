import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

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
}
