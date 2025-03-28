import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { AuthData, AuthService } from '../auth.service';

export interface UserSettings {
  email: string;
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  authData: AuthData = {
    isAuthenticated: false,
    userData: null,
    accessToken: '',
  };
  userSettings: UserSettings = {
    email: '',
    username: '',
    preferredUsername: '',
    leetcodeUsername: '',
  };

  constructor(private authService: AuthService) {
    this.authService.authData$.subscribe((authData) => {
      this.authData = authData;
    });
  }

  private convertToCamelCase(obj: any): UserSettings {
    return {
      email: obj.email,
      username: obj.username,
      preferredUsername: obj.preferred_username,
      leetcodeUsername: obj.leetcode_username,
    };
  }

  private convertToUnderscoreCase(settings: UserSettings): any {
    return {
      email: settings.email,
      username: settings.username,
      preferred_username: settings.preferredUsername,
      leetcode_username: settings.leetcodeUsername,
    };
  }

  async getUserSettings(): Promise<UserSettings> {
    if (!this.authData.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    try {
      const headers = new Headers({ Authorization: `Bearer ${this.authData.accessToken}` });
      const response = await fetch(`${environment.apiBaseUrl}/user/settings`, { headers });
      if (response.ok) {
        const data = await response.json();
        this.userSettings = this.convertToCamelCase(data);
        return this.userSettings;
      } else {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
    } catch (err) {
      throw err;
    }
  }

  async updateUserSettings(userSettings: UserSettings): Promise<any> {
    if (!this.authData.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    try {
      const underscoredSettings = this.convertToUnderscoreCase(userSettings);
      const headers = new Headers({
        Authorization: `Bearer ${this.authData.accessToken}`,
        'Content-Type': 'application/json',
      });
      const response = await fetch(`${environment.apiBaseUrl}/user/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(underscoredSettings),
      });

      if (response.ok) {
        const data = await response.json();
        this.userSettings = this.convertToCamelCase(data);
        return this.userSettings;
      } else {
        throw new Error(`Failed to update settings: ${response.status}`);
      }
    } catch (err) {
      throw err;
    }
  }
}
