import { Injectable, signal } from '@angular/core';

// Suit l'état réseau pour afficher un bandeau quand l'app est hors connexion.
@Injectable({ providedIn: 'root' })
export class ConnectivityService {

  readonly enLigne = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.enLigne.set(true));
    window.addEventListener('offline', () => this.enLigne.set(false));
  }
}
