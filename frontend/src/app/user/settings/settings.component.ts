import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UserService, UserSettings } from '../../api/user.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule], // Add FormsModule to imports
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isAuthenticated = false;
  isLoading = false;
  userSettings: UserSettings = {
    email: '',
    username: '',
    preferredUsername: '',
    leetcodeUsername: '',
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {
    this.authService.authData$.subscribe((authData) => {
      this.isAuthenticated = authData?.isAuthenticated || false;
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.userSettings = await this.userService.getUserSettings();
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    this.isLoading = true;
    try {
      this.userSettings = await this.userService.updateUserSettings(this.userSettings);
      console.log('Settings updated successfully!');
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      this.isLoading = false;
    }
  }
}
