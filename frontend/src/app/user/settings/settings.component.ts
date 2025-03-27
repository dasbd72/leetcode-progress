import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth.service';

interface UserSettings {
  email: string;
  username: string;
  preferred_username: string;
  leetcode_username: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule], // Add FormsModule to imports
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isAuthenticated = false;
  accessToken = '';
  userSettings: UserSettings = {
    email: '',
    username: '',
    preferred_username: '',
    leetcode_username: '',
  };

  constructor(private authService: AuthService) {
    this.authService.authData$.subscribe((authData) => {
      this.isAuthenticated = authData?.isAuthenticated || false;
      this.accessToken = authData?.accessToken || '';
    });
  }

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const headers = new Headers({ Authorization: `Bearer ${this.accessToken}` });
      const response = await fetch(`${environment.apiBaseUrl}/user/settings`, { headers });
      this.userSettings = await response.json();
      console.log('User settings:', this.userSettings);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  async onSubmit() {
    try {
      const headers = new Headers({
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      });
      const response = await fetch(`${environment.apiBaseUrl}/user/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(this.userSettings),
      });

      if (response.ok) {
        console.log('Settings updated successfully!');
        await this.loadSettings();
      } else {
        console.error('Failed to update settings:', response.status);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  }
}
