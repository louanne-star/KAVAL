import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';

const CLE = 'kaval_ratings_v1';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private _notes = signal<Record<string, number>>({});
  readonly notes = this._notes.asReadonly();

  constructor(private sync: SyncService) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._notes.set(JSON.parse(value));
    });
  }

  getNote(zoneId: string): number | null {
    return this._notes()[zoneId] ?? null;
  }

  async noter(zoneId: string, note: number): Promise<void> {
    const all = { ...this._notes(), [zoneId]: note };
    this._notes.set(all);
    await Preferences.set({ key: CLE, value: JSON.stringify(all) });
    this.sync.pushRating(zoneId, note);
  }

  async chargerDepuisCloud(ratings: Record<string, number>): Promise<void> {
    const merged = { ...this._notes(), ...ratings }; // cloud écrase le local
    this._notes.set(merged);
    await Preferences.set({ key: CLE, value: JSON.stringify(merged) });
  }

  async reinitialiser(): Promise<void> {
    this._notes.set({});
    await Preferences.remove({ key: CLE });
  }
}
