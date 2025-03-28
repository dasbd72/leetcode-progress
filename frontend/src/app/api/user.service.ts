import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

export interface UserSettings {
  email: string;
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSettingsSubject = new BehaviorSubject<UserSettings>({
    email: '',
    username: '',
    preferredUsername: '',
    leetcodeUsername: '',
  });

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  get userSettings$(): Observable<UserSettings> {
    return this.userSettingsSubject.asObservable();
  }

  private convertToCamelCase(obj: any): UserSettings {
    return {
      email: obj.email,
      username: obj.username,
      preferredUsername: obj.preferred_username,
      leetcodeUsername: obj.leetcode_username,
    };
  }

  private convertToUnderscoreCase(settings: UserSettings): any {
    return {
      email: settings.email,
      username: settings.username,
      preferred_username: settings.preferredUsername,
      leetcode_username: settings.leetcodeUsername,
    };
  }

  getUserSettings(): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${authData.accessToken}`,
        });
        return this.http.get<any>(`${environment.apiBaseUrl}/user/settings`, { headers }).pipe(
          map((data) => this.convertToCamelCase(data)),
          tap((settings) => this.userSettingsSubject.next(settings)),
          catchError((error) => {
            console.error('Failed to fetch settings:', error);
            return of({
              email: '',
              username: '',
              preferredUsername: '',
              leetcodeUsername: '',
            });
          }),
        );
      }),
    );
  }

  updateUserSettings(userSettings: UserSettings): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.accessToken),
      switchMap((authData) => {
        const underscoredSettings = this.convertToUnderscoreCase(userSettings);
        const headers = new HttpHeaders({
          Authorization: `Bearer ${authData.accessToken}`,
          'Content-Type': 'application/json',
        });
        return this.http
          .put<any>(`${environment.apiBaseUrl}/user/settings`, underscoredSettings, { headers })
          .pipe(
            map((data) => this.convertToCamelCase(data)),
            tap((settings) => this.userSettingsSubject.next(settings)),
            catchError((error) => {
              console.error('Failed to update settings:', error);
              return of(userSettings);
            }),
          );
      }),
    );
  }
}
