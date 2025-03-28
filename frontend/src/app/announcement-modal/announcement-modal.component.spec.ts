import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementModalComponent } from './announcement-modal.component';

describe('AnnouncementModalComponent', () => {
  let component: AnnouncementModalComponent;
  let fixture: ComponentFixture<AnnouncementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnouncementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
