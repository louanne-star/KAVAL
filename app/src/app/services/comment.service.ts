import { Injectable, signal } from '@angular/core';
import { SyncService } from './sync.service';
import { SupabaseService } from './supabase';

export interface CommentaireCommunaute {
  userId:    string;
  initiales: string;
  texte:     string;
  date:      string;
  note:      number | null;
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
      // Les notes sont stockées à part (user_ratings) : on les récupère en
      // parallèle pour afficher la note de chaque auteur à côté de son
      // commentaire, sans dupliquer la donnée dans user_comments.
      const [{ data }, { data: notesData }] = await Promise.all([
        this.supabase.client
          .from('user_comments')
          .select('user_id, initiales, comment, updated_at')
          .eq('zone_id', zoneId)
          .not('comment', 'is', null)
          .order('updated_at', { ascending: false }),
        this.supabase.client
          .from('user_ratings')
          .select('user_id, rating')
          .eq('zone_id', zoneId),
      ]);
      if (!data) return;

      const noteParUser = new Map(
        (notesData as { user_id: string; rating: number }[] | null ?? [])
          .map(r => [r.user_id, r.rating]),
      );

      const comments: CommentaireCommunaute[] = (data as any[])
        .filter(r => r.comment?.trim())
        .map(r => ({
          userId:    r.user_id,
          initiales: r.initiales ?? '?',
          texte:     r.comment,
          date:      r.updated_at,
          note:      noteParUser.get(r.user_id) ?? null,
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
