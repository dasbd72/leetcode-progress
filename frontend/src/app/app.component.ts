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
  tableData: { username: string, EASY: number, MEDIUM: number, HARD: number, TOTAL: number }[] = [];

  async ngOnInit() {
    try {
      const response = await fetch('https://dxdkojr9pk.execute-api.ap-northeast-1.amazonaws.com/Prod/');
      const result = await response.json();

      this.tableData = Object.entries(result).map(([username, stats]) => ({
        username,
        ...(stats as any)
      }));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }
}
