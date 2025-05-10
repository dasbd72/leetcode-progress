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

interface SubscriptionElement {
  username: string;
  preferredUsername: string;
  leetcodeUsername: string;
  subscribed: boolean;
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
  isLoadingSubscription = false;
  isLoadingSettings = false;
  isLoadingSubscriptionList = false;
  userList: User[] = [];
  userSettings: UserSettings = DefaultUserSettings;
  subscriptionList: string[] = [];
  displaySettings: {
    length: number;
    pageSize: number;
    pageIndex: number;
  } = {
    length: 0,
    pageSize: 25,
    pageIndex: 0,
  };
  subscriptionElementList: SubscriptionElement[] = [];
  displayIndices: number[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadUserList();
    this.loadSubscriptionList();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userList'] || changes['subscriptionList']) {
      this.updateDisplayedRows();
    }
  }

  private setLoadingSettings(loading: boolean) {
    this.isLoadingSettings = loading;
  }

  private setLoadingUserList(loading: boolean) {
    this.isLoadingUserList = loading;
    this.isLoadingSubscription = this.isLoadingUserList || this.isLoadingSubscriptionList;
  }

  private setLoadingSubscriptionList(loading: boolean) {
    this.isLoadingSubscriptionList = loading;
    this.isLoadingSubscription = this.isLoadingUserList || this.isLoadingSubscriptionList;
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
      console.warn('User list or subscription list is not available.');
      return;
    }
    this.displaySettings.length = this.userList.length;
    this.subscriptionElementList = this.userList.map((user) => ({
      username: user.username,
      preferredUsername: user.preferredUsername,
      leetcodeUsername: user.leetcodeUsername,
      subscribed: this.subscriptionList.includes(user.username),
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

  private handleSubscriptionListLoaded(subscriptionList: string[] | null) {
    if (subscriptionList) {
      this.subscriptionList = [...subscriptionList];
      this.updateDisplayedRows(); // Update displayed rows after loading subscription list
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

  private loadSubscriptionList() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingSubscriptionList(true)),
        switchMap(() => this.userService.getUserSubscriptionList()),
        tap((subscriptionList) => this.handleSubscriptionListLoaded(subscriptionList)),
        tap(() => this.setLoadingSubscriptionList(false)),
        catchError((error) => {
          console.error('Failed to load subscription list:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingSubscriptionList(false)),
      )
      .subscribe();
  }

  onSubscriptionClicked(index: number) {
    if (this.subscriptionElementList[index].subscribed) {
      this.subscriptionList.push(this.subscriptionElementList[index].username);
    } else {
      const subIndex = this.subscriptionList.indexOf(this.subscriptionElementList[index].username);
      if (subIndex > -1) {
        this.subscriptionList.splice(subIndex, 1);
      }
    }
  }

  onSelectAllSubscriptionClicked() {
    if (this.subscriptionElementList.every((element) => element.subscribed)) {
      this.subscriptionElementList.forEach((element) => (element.subscribed = false));
      this.subscriptionList = [];
    } else {
      this.subscriptionElementList.forEach((element) => (element.subscribed = true));
      this.subscriptionList = this.subscriptionElementList.map((element) => element.username);
    }
  }

  onSumbitSubscriptionList() {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        take(1),
        tap(() => this.setLoadingSubscriptionList(true)),
        switchMap(() => this.userService.updateUserSubscriptionList(this.subscriptionList)), // Pass subscriptionList
        tap((updatedSubscriptionList) =>
          this.handleSubscriptionListLoaded(updatedSubscriptionList),
        ),
        tap(() => this.setLoadingSubscriptionList(false)),
        catchError((error) => {
          console.error('Failed to update subscription list:', error);
          return of(null);
        }),
        finalize(() => this.setLoadingSubscriptionList(false)),
      )
      .subscribe();
  }
}
