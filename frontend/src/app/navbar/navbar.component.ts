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
  isUserDropdownOpen = false;
  isMobileMenuOpen = false; // Added for mobile menu

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
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // Close the mobile menu if the dropdown is opened
    if (this.isUserDropdownOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  // Added for mobile menu
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close the user dropdown if the mobile menu is opened
    if (this.isMobileMenuOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  // Added for mobile menu
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  // Closes user dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInsideUserDropdown =
      (event.target as HTMLElement).closest('.user-dropdown') !== null;
    const clickedInsideMobileMenu =
      (event.target as HTMLElement).closest('.mobile-menu') !== null ||
      (event.target as HTMLElement).closest('.mobile-menu-button') !== null;

    if (!clickedInsideUserDropdown) {
      this.isUserDropdownOpen = false;
    }
    if (!clickedInsideMobileMenu) {
      this.isMobileMenuOpen = false;
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
    this.closeMobileMenu(); // Close mobile menu when opening modal
  }
}
