import { Injectable, signal } from '@angular/core';

// Suit l'état réseau du navigateur pour afficher un bandeau clair quand
// l'app tourne hors connexion (la coquille Angular reste utilisable grâce
// au service worker, mais les données Supabase et certaines images non
// encore mises en cache ne peuvent pas être chargées). Utilisé par
// app.component.ts pour afficher ce bandeau.
@Injectable({ providedIn: 'root' })
export class ConnectivityService {

  readonly enLigne = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.enLigne.set(true));
    window.addEventListener('offline', () => this.enLigne.set(false));
  }
}
