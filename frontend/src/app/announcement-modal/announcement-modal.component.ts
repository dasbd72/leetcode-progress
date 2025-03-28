import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  HostListener,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';

import { Announcement } from '../api/announcement.service';

@Component({
  selector: 'app-announcement-modal',
  imports: [CommonModule],
  templateUrl: './announcement-modal.component.html',
  styleUrl: './announcement-modal.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class AnnouncementModalComponent {
  @Input() announcements: Array<Announcement> = [];
  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }

  // Closes dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInside =
      event.target instanceof HTMLElement && event.target.closest('.announcement-modal-inner');
    if (!clickedInside) {
      this.onClose();
    }
  }
}
