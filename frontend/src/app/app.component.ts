import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'LeetCode Progress Tracker';
  tableData: { username: string, easy: number, medium: number, hard: number, total: number }[] = [];

  sortKey: keyof typeof this.tableData[0] | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  async ngOnInit() {
    try {
      const response = await fetch('https://dxdkojr9pk.execute-api.ap-northeast-1.amazonaws.com/Prod/latest');
      const result = await response.json();

      this.tableData = Object.entries(result).map(([username, stats]) => ({
        username,
        ...(stats as any)
      }));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  sortBy(key: keyof typeof this.tableData[0]) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }

    this.tableData.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
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
}
