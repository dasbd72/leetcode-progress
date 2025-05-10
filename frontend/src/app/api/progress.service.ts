import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, catchError, filter, map, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface ProgressData {
  data: any;
  performance: any;
  usernames: string[];
}

export interface IntervalData {
  data: any;
  performance: any;
  usernames: string[];
}

const DefaultIntervalData: IntervalData = {
  data: [],
  performance: [],
  usernames: [],
};

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  getLatest(): Observable<ProgressData> {
    return this.http
      .get<any>(`${environment.apiBaseUrl}/progress/latest`)
      .pipe(map((data) => data as ProgressData));
  }

  private getLatestWithIntervalRequest(
    hours: number,
    limit: number,
    timezone?: string,
  ): Observable<IntervalData> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let url = `${environment.apiBaseUrl}/progress/latest/interval?hours=${hours}&limit=${limit}`;
    if (timezone) {
      url += `&timezone=${encodeURIComponent(timezone)}`;
    }
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Failed to fetch progress data:', error);
        return of(DefaultIntervalData);
      }),
    );
  }

  private getAuthLatestWithIntervalRequest(
    accessToken: string,
    hours: number,
    limit: number,
    timezone?: string,
  ): Observable<IntervalData> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    let url = `${environment.apiBaseUrl}/auth/progress/latest/interval?hours=${hours}&limit=${limit}`;
    if (timezone) {
      url += `&timezone=${encodeURIComponent(timezone)}`;
    }
    return this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Failed to fetch progress data:', error);
        return of(DefaultIntervalData);
      }),
    );
  }

  getLatestWithInterval(hours: number, limit: number, timezone?: string): Observable<IntervalData> {
    return this.authService.authData$.pipe(
      switchMap((authData) => {
        if (!authData.isAuthenticated || !authData.accessToken) {
          return this.getLatestWithIntervalRequest(hours, limit, timezone);
        }
        return this.getAuthLatestWithIntervalRequest(authData.accessToken, hours, limit, timezone);
      }),
    );
  }
}
