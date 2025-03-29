import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Announcement {
  title: string;
  content: string;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  constructor(private http: HttpClient) {}

  getAnnouncements(): Observable<Array<Announcement>> {
    return this.http
      .get<any>(`${environment.apiBaseUrl}/announcements`)
      .pipe(map((data) => data.announcements));
  }
}
