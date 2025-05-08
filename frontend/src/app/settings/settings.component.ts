import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { catchError, filter, finalize, of, switchMap, take, tap } from 'rxjs';

import { DefaultUserSettings, UserService, UserSettings } from '../api/user.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isLoading = false;
  userSettings: UserSettings = DefaultUserSettings;

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  loadSettings() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        tap(() => this.setLoading(true)),
        switchMap(() => this.userService.getUserSettings()),
        tap((settings) => this.handleSettingsLoaded(settings)),
        tap(() => this.setLoading(false)),
        catchError((error) => {
          console.error('Failed to load settings:', error);
          return of(null);
        }),
        finalize(() => this.setLoading(true)),
      )
      .subscribe();
  }

  private handleSettingsLoaded(settings: UserSettings | null) {
    if (settings) {
      this.userSettings = { ...settings }; // Initialize userSettings
    }
  }

  onSubmit() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoading(true)),
        switchMap(() => this.userService.updateUserSettings(this.userSettings)), // Pass userSettings
        tap((updatedSettings) => this.handleSettingsUpdated(updatedSettings)),
        tap(() => this.setLoading(false)),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          return of(null);
        }),
        finalize(() => this.setLoading(false)),
      )
      .subscribe();
  }

  private handleSettingsUpdated(updatedSettings: UserSettings) {
    this.userSettings = { ...updatedSettings }; // Update userSettings with response
    console.log('Settings updated successfully!');
  }
}
