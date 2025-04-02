import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { AnnouncementModalComponent } from './announcement-modal/announcement-modal.component';
import { Announcement, AnnouncementService } from './api/announcement.service';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, AnnouncementModalComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  announcements: Array<Announcement> = [];
  shouldShowAnnouncementModal: boolean = false;

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit(): void {
    // Check if the announcement modal should be shown
    const lastDisplayed = localStorage.getItem('announcementLastDisplayed');
    if (lastDisplayed && new Date().getTime() - Number(lastDisplayed) < 23 * 60 * 60 * 1000) {
      this.shouldShowAnnouncementModal = false;
    } else {
      this.shouldShowAnnouncementModal = true;
    }
    // Load announcement
    const lastFetched = localStorage.getItem('announcementLastFetched');
    if (!lastFetched || new Date().getTime() - Number(lastFetched) > 10 * 1000) {
      this.announcementService.getAnnouncements().subscribe({
        next: (announcements) => {
          this.announcements = announcements;
          localStorage.setItem('announcementLastFetched', String(new Date().getTime()));
          localStorage.setItem('announcements', JSON.stringify(announcements));
        },
        error: (error) => {
          console.error('Failed to load announcements:', error);
        },
      });
    } else {
      this.announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    }
  }

  showAnnouncementModal() {
    this.shouldShowAnnouncementModal = true;
  }

  closeAnnouncementModal() {
    this.shouldShowAnnouncementModal = false;
    localStorage.setItem('announcementLastDisplayed', String(new Date().getTime()));
  }
}
