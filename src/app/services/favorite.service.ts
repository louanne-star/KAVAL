import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';

const CLE = 'kaval_favoris_v1';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private _favoris = signal<Set<string>>(new Set());
  readonly favoris = this._favoris.asReadonly();

  constructor(private sync: SyncService) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._favoris.set(new Set(JSON.parse(value)));
    });
  }

  estFavori(zoneId: string): boolean {
    return this._favoris().has(zoneId);
  }

  async toggle(zoneId: string): Promise<void> {
    const s = new Set(this._favoris());
    if (s.has(zoneId)) {
      s.delete(zoneId);
      this.sync.pushFavoriSuppression(zoneId);
    } else {
      s.add(zoneId);
      this.sync.pushFavoriAjout(zoneId);
    }
    this._favoris.set(s);
    await Preferences.set({ key: CLE, value: JSON.stringify([...s]) });
  }

  async chargerDepuisCloud(favoris: string[]): Promise<void> {
    const merged = new Set([...this._favoris(), ...favoris]);
    this._favoris.set(merged);
    await Preferences.set({ key: CLE, value: JSON.stringify([...merged]) });
  }

  async reinitialiser(): Promise<void> {
    this._favoris.set(new Set());
    await Preferences.remove({ key: CLE });
  }
}
