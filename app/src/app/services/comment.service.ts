import { Injectable, signal } from '@angular/core';
import { SyncService } from './sync.service';
import { SupabaseService } from './supabase';

export interface CommentaireCommunaute {
  userId:    string;
  initiales: string;
  texte:     string;
  date:      string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private _commentairesZone = signal<Record<string, CommentaireCommunaute[]>>({});

  constructor(
    private sync:     SyncService,
    private supabase: SupabaseService,
  ) {}

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

  // Chaque appel ajoute un nouveau commentaire (un même utilisateur peut en
  // laisser plusieurs sur le même point) plutôt que de remplacer le précédent.
  async commenter(zoneId: string, texte: string): Promise<void> {
    await this.sync.pushComment(zoneId, texte);
    await this.chargerCommentairesZone(zoneId);
  }

  async reinitialiser(): Promise<void> {
    this._commentairesZone.set({});
  }
}
