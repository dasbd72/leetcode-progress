import { Routes } from '@angular/router';

import { TotalComponent } from './total/total.component';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  { path: '', redirectTo: 'total', pathMatch: 'full' },
  { path: 'total', component: TotalComponent },
  {
    path: 'chart',
    loadComponent: () => import('./chart/chart.component').then((m) => m.ChartComponent),
  },
  {
    path: 'settings',
    canActivate: [AutoLoginPartialRoutesGuard],
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
