import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { catchError, filter, of, switchMap, tap } from 'rxjs';

import { DefaultUserSettings, UserService, UserSettings } from '../api/user.service';
import { AuthData, AuthService, DefaultAuthData } from '../auth/auth.service';

const GithubSvg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  width="24"
  height="24"
>
  <path
    d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.799 8.205 11.387.6.111.82-.261.82-.58 0-.287-.012-1.243-.018-2.253-3.338.726-4.042-1.609-4.042-1.609-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.997.108-.775.419-1.305.763-1.604-2.665-.304-5.467-1.333-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404 11.52 11.52 0 0 1 3.003.404c2.292-1.552 3.298-1.23 3.298-1.23.653 1.649.242 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.807 5.625-5.48 5.922.43.372.823 1.103.823 2.222 0 1.604-.015 2.896-.015 3.289 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12Z"
  />
</svg>
`;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  @Output() showAnnouncements = new EventEmitter<void>();

  authData: AuthData = DefaultAuthData;
  userSettings: UserSettings = DefaultUserSettings;

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private userService: UserService,
  ) {
    this.iconRegistry.addSvgIconLiteral(
      'github-icon',
      this.sanitizer.bypassSecurityTrustHtml(GithubSvg),
    );
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
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
            filter((settings) => !!settings),
            tap((settings) => {
              this.userSettings = settings;
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
