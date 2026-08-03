import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SupabaseService } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ZoneMeta {
  id: string;
  nom: string;
  sousTitre: string;
  couleur: string;
  icone: string;
  ordre: number;
}

export interface PointVrai {
  id: string;
  zoneId: string;
  nom: string;
  description: string;
  coords: [number, number];
  rayon: number;
  ordre: number;
}

export interface PointPopup {
  id: string;
  zoneId: string;
  nom: string;
  description: string;
  coords: [number, number];
  icone: string;
}

interface CachePoints {
  zones:  ZoneMeta[];
  vrais:  PointVrai[];
  popups: PointPopup[];
}

const CLE_CACHE = 'kaval_points_cache_v1';

// ── Service ───────────────────────────────────────────────────────────────────
// Charge le contenu des zones/points depuis Supabase (source de vérité) et le
// met en cache localement pour un fonctionnement hors-ligne en secours.

@Injectable({ providedIn: 'root' })
export class PointsService {

  readonly zones       = signal<ZoneMeta[]>([]);
  readonly pointsVrai   = signal<PointVrai[]>([]);
  readonly pointsPopup  = signal<PointPopup[]>([]);
  readonly pret         = signal(false);
  readonly erreur       = signal<string | null>(null);

  constructor(private supabase: SupabaseService) {}

  async charger(): Promise<void> {
    try {
      const [z, p] = await Promise.all([
        this.supabase.client.from('zones').select('*').order('ordre'),
        this.supabase.client.from('points').select('*').order('ordre'),
      ]);
      if (z.error) throw z.error;
      if (p.error) throw p.error;

      const zones: ZoneMeta[] = (z.data ?? []).map((r: any) => ({
        id: r.id, nom: r.nom, sousTitre: r.sous_titre, couleur: r.couleur, icone: r.icone, ordre: r.ordre
      }));
      const vrais: PointVrai[] = (p.data ?? [])
        .filter((r: any) => r.type === 'vrai')
        .map((r: any) => ({
          id: r.id, zoneId: r.zone_id, nom: r.nom, description: r.description,
          coords: [r.lat, r.lng] as [number, number], rayon: r.rayon, ordre: r.ordre
        }));
      const popups: PointPopup[] = (p.data ?? [])
        .filter((r: any) => r.type === 'popup')
        .map((r: any) => ({
          id: r.id, zoneId: r.zone_id, nom: r.nom, description: r.description,
          coords: [r.lat, r.lng] as [number, number], icone: r.icone ?? '📍'
        }));

      this.zones.set(zones);
      this.pointsVrai.set(vrais);
      this.pointsPopup.set(popups);
      this.erreur.set(null);
      await Preferences.set({ key: CLE_CACHE, value: JSON.stringify({ zones, vrais, popups }) });
    } catch {
      const chargeDepuisCache = await this.chargerDepuisCache();
      if (!chargeDepuisCache) {
        this.erreur.set("Impossible de charger les points depuis Supabase et aucun cache local disponible.");
      }
    } finally {
      this.pret.set(true);
    }
  }

  private async chargerDepuisCache(): Promise<boolean> {
    const { value } = await Preferences.get({ key: CLE_CACHE });
    if (!value) return false;
    const cache: CachePoints = JSON.parse(value);
    this.zones.set(cache.zones);
    this.pointsVrai.set(cache.vrais);
    this.pointsPopup.set(cache.popups);
    return true;
  }

  metaDe(zoneId: string): ZoneMeta | undefined {
    return this.zones().find(z => z.id === zoneId);
  }

  popupsDeZone(zoneId: string): PointPopup[] {
    return this.pointsPopup().filter(p => p.zoneId === zoneId);
  }
}
