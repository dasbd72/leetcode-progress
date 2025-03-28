import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { catchError, filter, of, switchMap, takeUntil, tap } from 'rxjs';

import { AnnouncementModalComponent } from './announcement-modal/announcement-modal.component';
import { Announcement, AnnouncementService } from './api/announcement.service';
import { UserService, UserSettings } from './api/user.service';
import { AuthData, AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, AnnouncementModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  authData: AuthData = {
    isAuthenticated: false,
    userData: null,
    accessToken: '',
    isLoading: true,
  };
  userSettings: UserSettings = {
    email: '',
    username: '',
    preferredUsername: '',
    leetcodeUsername: '',
  };
  isDropdownOpen = false;
  announcements: Array<Announcement> = [];
  shouldShowAnnouncementModal: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private announcementService: AnnouncementService,
  ) {}

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Closes dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInside = event.target instanceof HTMLElement && event.target.closest('.dropdown');
    if (!clickedInside) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.authService.authData$
      .pipe(
        tap((authData) => {
          this.authData = authData;
          return authData;
        }),
        filter((authData) => authData.isAuthenticated && !!authData.accessToken),
        switchMap(() =>
          this.userService.getUserSettings().pipe(
            tap((settings) => {
              if (settings) {
                this.userSettings = settings;
              }
            }),
            catchError((error) => {
              console.error('Failed to load user settings:', error);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();

    // Check if the announcement modal should be shown
    const lastDisplayed = localStorage.getItem('announcementLastDisplayed');
    if (lastDisplayed && new Date().getTime() - Number(lastDisplayed) < 23 * 60 * 60 * 1000) {
      this.shouldShowAnnouncementModal = false;
    } else {
      this.shouldShowAnnouncementModal = true;
    }
    // Load announcement
    const lastFetched = localStorage.getItem('announcementLastFetched');
    if (!lastFetched || new Date().getTime() - Number(lastFetched) > 10 * 1000) {
      this.announcementService.announcements$
        .pipe(
          tap((announcements) => {
            this.announcements = announcements;
            localStorage.setItem('announcementLastFetched', String(new Date().getTime()));
            localStorage.setItem('announcements', JSON.stringify(announcements));
            return announcements;
          }),
          catchError((error) => {
            console.error('Failed to load announcements:', error);
            return of(null);
          }),
        )
        .subscribe();
    } else {
      this.announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    }
  }

  showAnnouncementModal() {
    this.shouldShowAnnouncementModal = true;
  }

  closeAnnouncementModal() {
    this.shouldShowAnnouncementModal = false;
    localStorage.setItem('announcementLastDisplayed', String(new Date().getTime()));
  }
}
