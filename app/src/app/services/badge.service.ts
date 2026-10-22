import { Injectable, signal } from '@angular/core';
import { Preferences } from '../core/preferences';
import { SyncService } from './sync.service';
import { SupabaseService } from './supabase';

const CLE = 'kaval_badges_v1';
const BUCKET_BADGES = 'badges';

// Fichier du bucket Storage "badges" pour chaque point déjà illustré par le
// musée — noms choisis à la main, pas de convention uniforme (voir capture
// fournie). Les points absents de cette liste retombent sur l'ancien badge
// SVG généré localement (voir badgeImageUrl juste en dessous).
const BADGE_FICHIERS: Record<string, string> = {
  camp_est_principal:                      '01 - Camp Est.png',
  four_a_chaux:                            '02 - Four a chaux.png',
  caserne_infanterie:                      '03 - Caserne d_infanterie.png',
  hotel_du_commandant:                     '04 - Hotel du commandant.png',
  chateau_eau_tour_guet:                   '05 - Chateau d_eau.png',
  chapelle_saint_thomas:                   '06 - Chapelle.png',
  logement_surveillant_principal:          '07 - Logement surveillant.png',
  quartier_cellulaire:                     '09 - Quartier cellulaire.png',
  logement_surveillants_1ere_classe:       '11 - Logment surveillants 1ere classe.png',
  logement_surveillants_militaires_maries: '10 - Logement surveillants maries.png',
  batiment_officiers_administration:       '12 - Batiment officiers administration.png',
  magasin_a_vivre:                         '13 - Magasin.png',
  briqueterie:                             '14 - Briqueterie.png',
  hopital_du_marais:                       '15 - Hopital du marais.png',
  ateliers:                                'Ateliers.png',
  boulangerie:                             'Boulangerie.png',
  boulevard_du_crime:                      'Boulevard du crime.png',
};

// Couleur dominante de chaque illustration du musée (relevée à la main sur
// l'image), pour que la pastille "visité" reprenne la couleur du badge
// plutôt qu'une teinte générique.
const BADGE_COULEURS: Record<string, string> = {
  camp_est_principal:                      '#999999',
  four_a_chaux:                            '#fa8510',
  caserne_infanterie:                      '#646f4b',
  hotel_du_commandant:                     '#0c3683',
  chateau_eau_tour_guet:                   '#225281',
  chapelle_saint_thomas:                   '#fbba00',
  logement_surveillant_principal:          '#39332d',
  quartier_cellulaire:                     '#a7833a',
  logement_surveillants_1ere_classe:       '#764a82',
  logement_surveillants_militaires_maries: '#b80071',
  batiment_officiers_administration:       '#ded1ba',
  magasin_a_vivre:                         '#977849',
  briqueterie:                             '#964a22',
  hopital_du_marais:                       '#2d6a4f',
  ateliers:                                '#b81800',
  boulangerie:                             '#db8e1a',
  boulevard_du_crime:                      '#a50100',
};
const COULEUR_BADGE_REPLI = '#27476e';

@Injectable({ providedIn: 'root' })
export class BadgeService {

  private _badges = signal<Set<string>>(new Set());

  constructor(
    private sync: SyncService,
    private supabase: SupabaseService,
  ) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._badges.set(new Set(JSON.parse(value)));
    });
  }

  // Image du badge d'un point : celle du musée (bucket Storage "badges") si
  // disponible, sinon repli sur l'ancien badge SVG généré localement. Le
  // musée ne fournit qu'une seule taille (contrairement à l'ancien système
  // qui avait un fichier dédié par taille) — on la réutilise en grand sur
  // l'écran de célébration comme en compact partout ailleurs.
  badgeImageUrl(pointId: string, variante: 'icone' | 'grand' = 'icone'): string {
    const fichier = BADGE_FICHIERS[pointId];
    if (fichier) {
      return this.supabase.client.storage.from(BUCKET_BADGES).getPublicUrl(fichier).data.publicUrl;
    }
    return variante === 'grand' ? `assets/badges/${pointId}.svg` : `assets/badges/${pointId}-icon.svg`;
  }

  badgeCouleur(pointId: string): string {
    return BADGE_COULEURS[pointId] ?? COULEUR_BADGE_REPLI;
  }

  // Même couleur que badgeCouleur, éclaircie pour servir de fond (ex: pastille
  // "Mini-jeu") derrière un texte/icône de la même teinte, pleine opacité.
  badgeCouleurClaire(pointId: string, alpha = 0.12): string {
    const hex = this.badgeCouleur(pointId).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  badges(): Set<string> {
    return this._badges();
  }

  aBadge(zoneId: string): boolean {
    return this._badges().has(zoneId);
  }

  async gagnerBadge(zoneId: string): Promise<void> {
    if (this._badges().has(zoneId)) return;
    const set = new Set(this._badges());
    set.add(zoneId);
    this._badges.set(set);
    await Preferences.set({ key: CLE, value: JSON.stringify([...set]) });
    await this.sync.pushBadge(zoneId);
  }

  async chargerDepuisCloud(badges: string[]): Promise<void> {
    const merged = new Set([...this._badges(), ...badges]);
    this._badges.set(merged);
    await Preferences.set({ key: CLE, value: JSON.stringify([...merged]) });
  }

  async reinitialiser(): Promise<void> {
    this._badges.set(new Set());
    await Preferences.remove({ key: CLE });
  }
}
