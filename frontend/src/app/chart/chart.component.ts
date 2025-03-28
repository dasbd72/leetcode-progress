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
    const parsedRes = await res.json();
    const rawData = parsedRes.data;

    const timestamps = Object.keys(rawData)
      .map(Number)
      .sort((a, b) => a - b);
    const fullLabels: string[] = timestamps.map((ts) => {
      // Helper function to zero-pad a number
      const zp = (num: number, length: number) => `${num}`.padStart(length, '0');
      const date = new Date(ts * 1000);
      if (this.interval === 'hour') {
        return `${zp(date.getHours(), 2)}:${zp(date.getMinutes(), 2)}`;
      } else if (window.innerWidth < 768) {
        return `${zp(date.getMonth() + 1, 2)}/${zp(date.getDate(), 2)}`;
      } else {
        return `${zp(date.getMonth() + 1, 2)}/${zp(date.getDate(), 2)} ${zp(date.getHours(), 2)}:${zp(date.getMinutes(), 2)}`;
      }
    });
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
        borderColor: this.hashStringToHSL(username),
      });
    }

    this.lineChartData = { labels, datasets };
  }

  private hashStringToVal(str: string, range: Array<number>): number {
    const prime = 11; // A prime number multiplier
    const hashVal = str
      .split('')
      .reduce((acc, char) => (acc * prime + char.charCodeAt(0)) >>> 0, 0);
    return (hashVal % (range[1] - range[0])) + range[0];
  }

  private hashStringToHSL(str: string): string {
    const hueRange = [0, 360]; // Hue: 0-360 degrees
    const saturationRange = [40, 99];
    const lightnessRange = [40, 80];
    const hue = this.hashStringToVal(`hue_${str}_hue`, hueRange);
    const saturation = this.hashStringToVal(`sat_${str}_sat`, saturationRange);
    const lightness = this.hashStringToVal(`lig_${str}_lig`, lightnessRange);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}
