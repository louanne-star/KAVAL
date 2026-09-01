import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';

const CLE = 'kaval_badges_v1';

@Injectable({ providedIn: 'root' })
export class BadgeService {

  private _badges = signal<Set<string>>(new Set());

  constructor(private sync: SyncService) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._badges.set(new Set(JSON.parse(value)));
    });
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
