import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  preferredUsername = '';

  isDropdownOpen = false;

  constructor(private authService: AuthService) {}

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
    this.authService.authData$.subscribe((authData) => {
      this.isAuthenticated = authData.isAuthenticated;
      this.preferredUsername = authData.preferredUsername;
    });
  }
}
