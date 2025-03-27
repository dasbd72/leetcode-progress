import { Routes } from '@angular/router';

import { TotalComponent } from './total/total.component';
import { SettingsComponent } from './user/settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: TotalComponent },
      { path: 'total', component: TotalComponent },
      {
        path: 'chart',
        loadComponent: () => import('./chart/chart.component').then((m) => m.ChartComponent),
      },
      {
        path: 'u',
        children: [{ path: 'settings', component: SettingsComponent }],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
