import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SyncService } from './sync.service';
import { SupabaseService } from './supabase';

export interface CommentaireCommunaute {
  userId:    string;
  initiales: string;
  texte:     string;
  date:      string;
}

const CLE = 'kaval_comments_v1';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private _mesCommentaires  = signal<Record<string, string>>({});
  private _commentairesZone = signal<Record<string, CommentaireCommunaute[]>>({});

  readonly commentaires = this._mesCommentaires.asReadonly();

  constructor(
    private sync:     SyncService,
    private supabase: SupabaseService,
  ) {
    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value) this._mesCommentaires.set(JSON.parse(value));
    });
  }

  getCommentaire(zoneId: string): string | null {
    return this._mesCommentaires()[zoneId] ?? null;
  }

  getCommentairesZone(zoneId: string): CommentaireCommunaute[] {
    return this._commentairesZone()[zoneId] ?? [];
  }

  async chargerCommentairesZone(zoneId: string): Promise<void> {
    try {
      const { data } = await this.supabase.client
        .from('user_comments')
        .select('user_id, initiales, comment, updated_at')
        .eq('zone_id', zoneId)
        .not('comment', 'is', null)
        .order('updated_at', { ascending: false });
      if (!data) return;

      const comments: CommentaireCommunaute[] = (data as any[])
        .filter(r => r.comment?.trim())
        .map(r => ({
          userId:    r.user_id,
          initiales: r.initiales ?? '?',
          texte:     r.comment,
          date:      r.updated_at,
        }));

      this._commentairesZone.set({ ...this._commentairesZone(), [zoneId]: comments });
    } catch {}
  }

  async commenter(zoneId: string, texte: string): Promise<void> {
    const all = { ...this._mesCommentaires(), [zoneId]: texte };
    this._mesCommentaires.set(all);
    await Preferences.set({ key: CLE, value: JSON.stringify(all) });
    await this.sync.pushComment(zoneId, texte);
    await this.chargerCommentairesZone(zoneId);
  }

  async chargerDepuisCloud(comments: Record<string, string>): Promise<void> {
    const merged = { ...this._mesCommentaires(), ...comments };
    this._mesCommentaires.set(merged);
    await Preferences.set({ key: CLE, value: JSON.stringify(merged) });
  }

  async reinitialiser(): Promise<void> {
    this._mesCommentaires.set({});
    this._commentairesZone.set({});
    await Preferences.remove({ key: CLE });
  }
}
