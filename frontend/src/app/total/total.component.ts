import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { environment } from '../../environments/environment';
import { ProgressService } from '../api/progress.service';

type TableData = { username: string; easy: number; medium: number; hard: number; total: number }[];
type SortKey = 'username' | 'easy' | 'medium' | 'hard' | 'total' | '';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-total',
  imports: [CommonModule],
  templateUrl: './total.component.html',
  styleUrl: './total.component.css',
})
export class TotalComponent implements OnInit {
  constructor(private progressService: ProgressService) {}

  title = 'LeetCode Progress Tracker';
  tableData: TableData = [];

  sortKey: SortKey = 'total';
  sortDirection: SortDirection = 'desc';

  async ngOnInit() {
    this.progressService.getLatest().subscribe({
      next: (result) => {
        this.tableData = result;
        this.sortData();
      },
      error: (err) => {
        console.error('Failed to fetch data:', err);
      },
    });
  }

  sortData() {
    if (this.sortKey === '') {
      return;
    }
    this.tableData.sort((a, b) => {
      const valA = a[this.sortKey as keyof typeof a];
      const valB = b[this.sortKey as keyof typeof b];
      if (typeof valA === 'string') {
        return this.sortDirection === 'asc'
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA);
      }
      return this.sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }

  sortBy(key: keyof (typeof this.tableData)[0]) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'desc';
    }
    this.sortData();
  }
}
