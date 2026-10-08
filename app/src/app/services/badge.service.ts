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
  four_a_chaux:                            '02 - Four a chaux.png',
  caserne_infanterie:                      '03 - Caserne d_infanterie.png',
  chateau_eau_tour_guet:                   '05 - Chateau d_eau.png',
  chapelle_saint_thomas:                   '06 - Chapelle.png',
  logement_surveillants_militaires_maries: '10 - Logement surveillants maries.png',
  batiment_officiers_administration:       '12 - Batiment officiers administration.png',
  briqueterie:                             '14 - Briqueterie.png',
  hopital_du_marais:                       '15 - Hopital du marais.png',
  boulevard_du_crime:                      'Boulevard du crime.png',
};

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
