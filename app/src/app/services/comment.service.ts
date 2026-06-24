import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const CLE = 'kaval_comments_v1';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private _commentaires = signal<Record<string, string>>({});
  readonly commentaires = this._commentaires.asReadonly();

  constructor() {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._commentaires.set(JSON.parse(value));
    });
  }

  getCommentaire(zoneId: string): string | null {
    return this._commentaires()[zoneId] ?? null;
  }

  async commenter(zoneId: string, texte: string): Promise<void> {
    const all = { ...this._commentaires(), [zoneId]: texte };
    this._commentaires.set(all);
    await Preferences.set({ key: CLE, value: JSON.stringify(all) });
  }

  async reinitialiser(): Promise<void> {
    this._commentaires.set({});
    await Preferences.remove({ key: CLE });
  }
}
