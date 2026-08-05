import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';
import { SupabaseService } from './supabase';

export interface MoyenneZone { moyenne: number; nb: number; }

const CLE = 'kaval_ratings_v1';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private _maNote   = signal<Record<string, number>>({});
  private _moyennes = signal<Record<string, MoyenneZone>>({});

  readonly notes = this._maNote.asReadonly();

  constructor(
    private sync:     SyncService,
    private supabase: SupabaseService,
  ) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._maNote.set(JSON.parse(value));
    });
  }

  getNote(zoneId: string): number | null {
    return this._maNote()[zoneId] ?? null;
  }

  getMoyenne(zoneId: string): MoyenneZone | null {
    return this._moyennes()[zoneId] ?? null;
  }

  async noter(zoneId: string, note: number): Promise<void> {
    const all = { ...this._maNote(), [zoneId]: note };
    this._maNote.set(all);
    await Preferences.set({ key: CLE, value: JSON.stringify(all) });
    await this.sync.pushRating(zoneId, note);
    this.chargerMoyennes();
  }

  async chargerMoyennes(): Promise<void> {
    try {
      const { data } = await this.supabase.client
        .from('user_ratings')
        .select('zone_id, rating');
      if (!data) return;

      const grouped: Record<string, number[]> = {};
      for (const r of data as { zone_id: string; rating: number }[]) {
        if (!grouped[r.zone_id]) grouped[r.zone_id] = [];
        grouped[r.zone_id].push(r.rating);
      }
      const moyennes: Record<string, MoyenneZone> = {};
      for (const [zoneId, notes] of Object.entries(grouped)) {
        moyennes[zoneId] = {
          moyenne: notes.reduce((a, b) => a + b, 0) / notes.length,
          nb:      notes.length,
        };
      }
      this._moyennes.set(moyennes);
    } catch {}
  }

  async chargerDepuisCloud(ratings: Record<string, number>): Promise<void> {
    const merged = { ...this._maNote(), ...ratings };
    this._maNote.set(merged);
    await Preferences.set({ key: CLE, value: JSON.stringify(merged) });
  }

  async reinitialiser(): Promise<void> {
    this._maNote.set({});
    this._moyennes.set({});
    await Preferences.remove({ key: CLE });
  }
}
