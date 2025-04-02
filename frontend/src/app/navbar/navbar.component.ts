import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { catchError, filter, of, switchMap, tap } from 'rxjs';

import { UserService, UserSettings } from '../api/user.service';
import { AuthData, AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  @Output() showAnnouncements = new EventEmitter<void>();

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
              return of(null); // Return observable here
            }),
          ),
        ),
      )
      .subscribe();
  }

  // Method to emit the event
  showAnnouncementModal() {
    this.showAnnouncements.emit();
  }
}
