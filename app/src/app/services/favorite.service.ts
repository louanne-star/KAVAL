import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';

const CLE = 'kaval_favoris_v1';

@Injectable({ providedIn: 'root' })
export class FavoriteService {

  private _favoris = signal<Set<string>>(new Set());

  constructor(private sync: SyncService) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._favoris.set(new Set(JSON.parse(value)));
    });
  }

  estFavori(zoneId: string): boolean {
    return this._favoris().has(zoneId);
  }

  favoris(): Set<string> {
    return this._favoris();
  }

  async toggle(zoneId: string): Promise<void> {
    const set = new Set(this._favoris());
    if (set.has(zoneId)) {
      set.delete(zoneId);
      this._favoris.set(set);
      await Preferences.set({ key: CLE, value: JSON.stringify([...set]) });
      await this.sync.pushFavoriSuppression(zoneId);
    } else {
      set.add(zoneId);
      this._favoris.set(set);
      await Preferences.set({ key: CLE, value: JSON.stringify([...set]) });
      await this.sync.pushFavoriAjout(zoneId);
    }
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
