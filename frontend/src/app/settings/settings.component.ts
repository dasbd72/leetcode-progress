import { CommonModule } from '@angular/common';
import { Component, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { catchError, filter, finalize, map, of, switchMap, take, tap } from 'rxjs';

import { DefaultUserSettings, User, UserService, UserSettings } from '../api/user.service';
import { AuthService } from '../auth/auth.service';

interface FollowingElement {
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
  following: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent implements OnChanges, OnInit {
  isLoadingUserList = false;
  isLoadingFollowing = false;
  isLoadingSettings = false;
  isLoadingFollowingList = false;
  userList: User[] = [];
  userSettings: UserSettings = DefaultUserSettings;
  followingList: string[] = [];
  displaySettings: {
    length: number;
    pageSize: number;
    pageIndex: number;
  } = {
    length: 0,
    pageSize: 25,
    pageIndex: 0,
  };
  followingElementList: FollowingElement[] = [];
  displayIndices: number[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadUserList();
    this.loadFollowingList();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userList'] || changes['followingList']) {
      this.updateDisplayedRows();
    }
  }

  private setLoadingSettings(loading: boolean) {
    this.isLoadingSettings = loading;
  }

  private setLoadingUserList(loading: boolean) {
    this.isLoadingUserList = loading;
    this.isLoadingFollowing = this.isLoadingUserList || this.isLoadingFollowingList;
  }

  private setLoadingFollowingList(loading: boolean) {
    this.isLoadingFollowingList = loading;
    this.isLoadingFollowing = this.isLoadingUserList || this.isLoadingFollowingList;
  }

  private handleSettingsLoaded(settings: UserSettings | null) {
    if (settings) {
      this.userSettings = { ...settings };
    }
  }

  private loadSettings() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingSettings(true)),
        switchMap(() => this.userService.getUserSettings()),
        tap((settings) => this.handleSettingsLoaded(settings)),
        tap(() => this.setLoadingSettings(false)),
        catchError((error) => {
          console.error('Failed to load settings:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingSettings(false)),
      )
      .subscribe();
  }

  onSubmitUserSettings() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingSettings(true)),
        switchMap(() => this.userService.updateUserSettings(this.userSettings)), // Pass userSettings
        tap((updatedSettings) => this.handleSettingsLoaded(updatedSettings)),
        tap(() => this.setLoadingSettings(false)),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingSettings(false)),
      )
      .subscribe();
  }

  private updateDisplayedRows() {
    if (!this.userList) {
      console.warn('User list or following list is not available.');
      return;
    }
    this.displaySettings.length = this.userList.length;
    this.followingElementList = this.userList.map((user) => ({
      username: user.username,
      preferredUsername: user.preferredUsername,
      leetcodeUsername: user.leetcodeUsername,
      following: this.followingList.includes(user.username),
    }));
    this.displayIndices = Array.from(
      {
        length: Math.min(
          this.displaySettings.pageSize,
          this.displaySettings.length -
            this.displaySettings.pageIndex * this.displaySettings.pageSize,
        ),
      },
      (_, i) => i + this.displaySettings.pageIndex * this.displaySettings.pageSize,
    );
  }

  onPageChange(event: any) {
    this.displaySettings.pageIndex = event.pageIndex;
    this.displaySettings.pageSize = event.pageSize;
    this.updateDisplayedRows();
  }

  private handleUserListLoaded(userList: User[] | null) {
    if (userList) {
      this.userList = userList; // Initialize userList
      this.updateDisplayedRows(); // Update displayed rows after loading user list
    }
  }

  private handleFollowingListLoaded(followingList: string[] | null) {
    if (followingList) {
      this.followingList = [...followingList];
      this.updateDisplayedRows(); // Update displayed rows after loading following list
    }
  }

  private loadUserList() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingUserList(true)),
        switchMap(() => this.userService.getUserList()),
        map((userList) =>
          // Sort the user list by preferred username
          userList.sort((a, b) => a.preferredUsername.localeCompare(b.preferredUsername)),
        ),
        tap((userList) => this.handleUserListLoaded(userList)),
        tap(() => this.setLoadingUserList(false)),
        catchError((error) => {
          console.error('Failed to load user list:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingUserList(true)),
      )
      .subscribe();
  }

  private loadFollowingList() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingFollowingList(true)),
        switchMap(() => this.userService.getUserFollowingList()),
        tap((followingList) => this.handleFollowingListLoaded(followingList)),
        tap(() => this.setLoadingFollowingList(false)),
        catchError((error) => {
          console.error('Failed to load following list:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingFollowingList(false)),
      )
      .subscribe();
  }

  onFollowingClicked(index: number) {
    if (this.followingElementList[index].following) {
      this.followingList.push(this.followingElementList[index].username);
    } else {
      const subIndex = this.followingList.indexOf(this.followingElementList[index].username);
      if (subIndex > -1) {
        this.followingList.splice(subIndex, 1);
      }
    }
  }

  onSelectAllFollowingClicked() {
    if (this.followingElementList.every((element) => element.following)) {
      this.followingElementList.forEach((element) => (element.following = false));
      this.followingList = [];
    } else {
      this.followingElementList.forEach((element) => (element.following = true));
      this.followingList = this.followingElementList.map((element) => element.username);
    }
  }

  onSumbitFollowingList() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingFollowingList(true)),
        switchMap(() => this.userService.updateUserFollowingList(this.followingList)), // Pass followingList
        tap((updatedFollowingList) => this.handleFollowingListLoaded(updatedFollowingList)),
        tap(() => this.setLoadingFollowingList(false)),
        catchError((error) => {
          console.error('Failed to update following list:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingFollowingList(false)),
      )
      .subscribe();
  }
}
