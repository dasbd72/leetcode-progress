import { Routes } from '@angular/router';
import { TotalComponent } from './total/total.component';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: TotalComponent },
      { path: 'total', component: TotalComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
