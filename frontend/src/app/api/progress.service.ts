import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ProgressData {
  username: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  constructor(private http: HttpClient) {}

  getLatest(): Observable<ProgressData[]> {
    return this.http.get<any>(`${environment.apiBaseUrl}/latest`).pipe(
      map((data) => {
        return Object.entries(data).map(([username, stats]) => ({
          username,
          ...(stats as any),
        }));
      }),
    );
  }

  getLatestWithInterval(interval: string, timezone?: string): Observable<any> {
    let url = `${environment.apiBaseUrl}/latest/${interval}`;
    if (timezone) {
      url += `?timezone=${encodeURIComponent(timezone)}`;
    }
    return this.http.get<any>(url).pipe(map((data) => data.data));
  }
}
