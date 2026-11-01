// État UI partagé entre les pages (nav masquée, retour sur la carte).
import { Injectable, signal } from '@angular/core';

// Permet à une page routée (ex: mini-jeu plein écran) de masquer la nav
// custom du shell. Un simple z-index ne suffit pas : ion-router-outlet
// applique un transform pendant les transitions, qui crée un nouveau
// contexte d'empilement et rend le z-index inefficace.
export interface EtatCarteAOuvrir {
  pointId: string;
  zoom: number;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly navMasquee = signal(false);

  // Mémorise le zoom/centrage de la carte en quittant vers la fiche détail
  // d'un point, pour les restituer au retour. Remis à null une fois consommé.
  readonly pointARouvrir = signal<EtatCarteAOuvrir | null>(null);
}
