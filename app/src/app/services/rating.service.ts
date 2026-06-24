import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const CLE = 'kaval_ratings_v1';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private _notes = signal<Record<string, number>>({});
  readonly notes = this._notes.asReadonly();

  constructor() {
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
  }

  async reinitialiser(): Promise<void> {
    this._notes.set({});
    await Preferences.remove({ key: CLE });
  }
}
