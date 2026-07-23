import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';

const CLE_BADGES = 'kaval_badges_v1';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private _badges = signal<Set<string>>(new Set());
  readonly badges = this._badges.asReadonly();

  constructor(private sync: SyncService) {
    Preferences.get({ key: CLE_BADGES }).then(({ value }) => {
      if (value) this._badges.set(new Set(JSON.parse(value)));
    });
  }

  aBadge(zoneId: string): boolean {
    return this._badges().has(zoneId);
  }

  async gagnerBadge(zoneId: string): Promise<void> {
    const set = new Set(this._badges());
    set.add(zoneId);
    this._badges.set(set);
    await Preferences.set({ key: CLE_BADGES, value: JSON.stringify([...set]) });
    this.sync.pushBadge(zoneId);
  }

  async chargerDepuisCloud(badges: string[]): Promise<void> {
    const merged = new Set([...this._badges(), ...badges]);
    this._badges.set(merged);
    await Preferences.set({ key: CLE_BADGES, value: JSON.stringify([...merged]) });
  }

  async reinitialiser(): Promise<void> {
    this._badges.set(new Set());
    await Preferences.remove({ key: CLE_BADGES });
    this.sync.resetAll();
  }
}
