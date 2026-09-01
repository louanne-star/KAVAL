import { Injectable, signal } from '@angular/core';

// Permet à une page routée (ex: mini-jeu plein écran) de masquer la nav
// custom du shell (tabs.page.ts). Un simple z-index ne suffit pas : la nav
// est en z-index 9999 dans un contexte d'empilement au-dessus de la page,
// alors que le contenu routé peut se retrouver piégé dans un contexte
// d'empilement local (transform appliqué par ion-router-outlet pendant les
// transitions de page), rendant tout z-index inefficace contre elle.
export interface EtatCarteAOuvrir {
  pointId: string;
  zoom: number;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly navMasquee = signal(false);

  // Mémorise le zoom/centrage de la carte au moment où on quitte vers la
  // fiche détail d'un point (page Parcours), pour les restituer exactement
  // au retour — plutôt qu'un zoom fixe arbitraire. Consommé une seule fois
  // (remis à null) par MapPage à la réouverture.
  readonly pointARouvrir = signal<EtatCarteAOuvrir | null>(null);
}
