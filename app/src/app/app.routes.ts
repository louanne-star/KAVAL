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
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then(m => m.OnboardingPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () => import('./pages/mot-de-passe-oublie/mot-de-passe-oublie.page').then(m => m.MotDePasseOubliePage),
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () => import('./pages/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe.page').then(m => m.ReinitialiserMotDePassePage),
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
    path: 'favoris',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/favoris/favoris.page').then(m => m.FavorisPage),
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
