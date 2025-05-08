import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Observable, catchError, filter, finalize, of, switchMap, tap } from 'rxjs';

import { UserService, UserSettings } from '../api/user.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isLoading = false;
  userSettings: UserSettings = {
    email: '',
    username: '',
    preferredUsername: '',
    leetcodeUsername: '',
  };
  userSettings$: Observable<UserSettings | null> = of(null);

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.userSettings$ = this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap(() => this.userService.getUserSettings()),
      tap((settings) => {
        if (settings) {
          this.userSettings = { ...settings }; // Initialize userSettings
        }
        this.isLoading = false;
      }),
      catchError((error) => {
        console.error('Failed to load settings:', error);
        this.isLoading = false;
        return of(null);
      }),
    );
  }

  onSubmit() {
    this.isLoading = true;
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(
          () => this.userService.updateUserSettings(this.userSettings), // Pass userSettings
        ),
        tap((updatedSettings) => {
          this.userSettings = { ...updatedSettings }; // Update userSettings with response
          this.isLoading = false;
          console.log('Settings updated successfully!');
        }),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          this.isLoading = false;
          return of(null);
        }),
      )
      .subscribe();
  }
}
