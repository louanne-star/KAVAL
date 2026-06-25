import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

const authGuard = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  await auth.waitForSession();
  return auth.estConnecte() ? true : router.parseUrl('/login');
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./splash/splash.page').then(m => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage),
  },
  {
    path: 'compte',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/compte/compte.page').then(m => m.ComptePage),
  },
  {
    path: 'recherche',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/recherche/recherche.page').then(m => m.RecherchePage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
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
