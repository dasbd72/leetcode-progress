import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { catchError, filter, of, switchMap, takeUntil, tap } from 'rxjs';

import { UserService, UserSettings } from './api/user.service';
import { AuthData, AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
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

  constructor(
    private authService: AuthService,
    private userService: UserService,
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
  }
}
