import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../environments/environment';
import { ChartConfiguration, ChartDataset, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

type ChartInterval = 'hour' | 'day';
type ChartMode = 'total' | 'delta';
type ChartDifficulty = 'easy' | 'medium' | 'hard' | 'total';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnInit {
  lineChartType: ChartType = 'line';
  lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Problems' }, beginAtZero: true },
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  interval: ChartInterval = (localStorage.getItem('chart-interval') as ChartInterval) ?? 'day';
  mode: ChartMode = (localStorage.getItem('chart-mode') as ChartMode) ?? 'delta';
  difficulty: ChartDifficulty =
    (localStorage.getItem('chart-difficulty') as ChartDifficulty) ?? 'total';
  onIntervalChange(value: ChartInterval) {
    this.interval = value;
    localStorage.setItem('chart-interval', value);
    this.fetchChartData();
  }
  onModeChange(value: ChartMode) {
    this.mode = value;
    localStorage.setItem('chart-mode', value);
    this.fetchChartData();
  }
  onDifficultyChange(value: ChartDifficulty) {
    this.difficulty = value;
    localStorage.setItem('chart-difficulty', value);
    this.fetchChartData();
  }

  async ngOnInit() {
    await this.fetchChartData();
  }

  async fetchChartData() {
    // Get the timezone from the browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    const baseUrl = `${environment.apiBaseUrl}/latest/${this.interval}`;
    // Append the timezone to the URL if the interval is 'day'
    const url =
      this.interval === 'day' ? `${baseUrl}?timezone=${encodeURIComponent(timezone)}` : baseUrl;
    // Fetch the data from the API
    const res = await fetch(url);
    const rawData = await res.json();

    const timestamps = Object.keys(rawData)
      .map(Number)
      .sort((a, b) => a - b);
    const fullLabels: string[] = timestamps.map((ts) =>
      new Date(ts * 1000).toLocaleTimeString(
        [],
        this.interval === 'hour'
          ? { hour: '2-digit', minute: '2-digit' }
          : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      ),
    );
    const labels = this.mode === 'delta' ? fullLabels.slice(1) : fullLabels;

    const allUsers = new Set<string>();
    for (const ts of timestamps) {
      Object.keys(rawData[ts]).forEach((username) => allUsers.add(username));
    }
    const datasets: ChartDataset<'line'>[] = [];

    for (const username of allUsers) {
      const data: number[] = [];
      if (this.mode === 'total') {
        for (let i = 0; i < timestamps.length; i++) {
          const stats = rawData[timestamps[i]]?.[username];
          const total = stats?.[this.difficulty] ?? null;
          data.push(total);
        }
      } else if (this.mode === 'delta') {
        for (let i = 1; i < timestamps.length; i++) {
          const prevStats = rawData[timestamps[i - 1]]?.[username];
          const prevTotal = prevStats?.[this.difficulty] ?? 0;
          const stats = rawData[timestamps[i]]?.[username];
          const total = stats?.[this.difficulty] ?? 0;
          if (stats === undefined || prevStats === undefined) {
            data.push(0);
          } else {
            data.push(total - prevTotal);
          }
        }
      }

      datasets.push({
        label: username,
        data,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
      });
    }

    this.lineChartData = { labels, datasets };
  }
}
