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
  private apiUrl = environment.apiBaseUrl + '/announcements';

  constructor(private http: HttpClient) {}

  get announcements$(): Observable<Array<Announcement>> {
    return this.http.get<any>(this.apiUrl).pipe(map((data) => data.announcements));
  }
}
