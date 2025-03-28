import { Routes } from '@angular/router';

import { TotalComponent } from './total/total.component';
import { SettingsComponent } from './user/settings/settings.component';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'total', pathMatch: 'full' },
      { path: 'total', component: TotalComponent },
      {
        path: 'chart',
        loadComponent: () => import('./chart/chart.component').then((m) => m.ChartComponent),
      },
      {
        path: 'u',
        canActivate: [AutoLoginPartialRoutesGuard],
        children: [{ path: 'settings', component: SettingsComponent }],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
