import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./splash/splash.page').then(m => m.SplashPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'carte',
        loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage),
      },
      {
        path: 'parcours',
        loadComponent: () => import('./pages/parcours/parcours.page').then(m => m.ParcoursPage),
      },
{
        path: 'apropos',
        loadComponent: () => import('./pages/apropos/apropos.page').then(m => m.AproposPage),
      },
      {
        path: '',
        redirectTo: 'carte',
        pathMatch: 'full'
      }
    ]
  }
];