import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  constructor(private http: HttpClient) {}

  getLatest(): Observable<ProgressData> {
    return this.http
      .get<any>(`${environment.apiBaseUrl}/latest`)
      .pipe(map((data) => data as ProgressData));
  }

  getLatestWithInterval(hours: number, limit: number, timezone?: string): Observable<IntervalData> {
    let url = `${environment.apiBaseUrl}/latest/interval?hours=${hours}&limit=${limit}`;
    if (timezone) {
      url += `&timezone=${encodeURIComponent(timezone)}`;
    }
    return this.http.get<any>(url).pipe(map((data) => data as IntervalData));
  }
}
