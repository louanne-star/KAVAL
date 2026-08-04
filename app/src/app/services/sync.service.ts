import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SupabaseService } from './supabase';
import { AuthService } from './auth.service';

const CLE_DERNIER_UID = 'kaval_dernier_uid';

export interface DonneesCloud {
  badges:   string[];
  ratings:  Record<string, number>;
  comments: Record<string, string>;
  favoris:  string[];
}

@Injectable({ providedIn: 'root' })
export class SyncService {

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  private get db()  { return this.supabase.client; }
  private get uid() { return this.auth.userId; }

  // ── Détection de changement de compte sur cet appareil ─────────────────────
  // Les caches locaux (badges, notes, commentaires, favoris) ne sont pas
  // scopés par utilisateur : sans ça, se connecter avec un autre compte sur
  // le même appareil hérite silencieusement des données du compte précédent
  // tant que le cloud ne les a pas toutes écrasées (merge, pas remplacement).

  async estNouveauCompte(): Promise<boolean> {
    const uid = this.uid;
    if (!uid) return false;
    const { value } = await Preferences.get({ key: CLE_DERNIER_UID });
    await Preferences.set({ key: CLE_DERNIER_UID, value: uid });
    return value !== null && value !== uid;
  }

  // ── Pull : récupère toutes les données cloud de l'utilisateur ─────────────

  async syncAll(): Promise<DonneesCloud | null> {
    const uid = this.uid;
    if (!uid) return null;
    try {
      const [b, r, c, f] = await Promise.all([
        this.db.from('user_badges')   .select('zone_id')         .eq('user_id', uid),
        this.db.from('user_ratings')  .select('zone_id,rating')  .eq('user_id', uid),
        this.db.from('user_comments') .select('zone_id,comment') .eq('user_id', uid),
        this.db.from('user_favorites').select('zone_id')         .eq('user_id', uid),
      ]);
      return {
        badges:   (b.data ?? []).map((row: any) => row.zone_id as string),
        ratings:  (r.data ?? []).reduce((acc: Record<string, number>,  row: any) => { acc[row.zone_id] = row.rating;  return acc; }, {}),
        comments: (c.data ?? []).reduce((acc: Record<string, string>,  row: any) => { acc[row.zone_id] = row.comment; return acc; }, {}),
        favoris:  (f.data ?? []).map((row: any) => row.zone_id as string),
      };
    } catch {
      return null;
    }
  }

  // ── Push : envoie une donnée en arrière-plan (silencieux si hors-ligne) ───

  async pushBadge(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await this.db.from('user_badges').upsert({ user_id: uid, zone_id: zoneId });
    } catch {}
  }

  async pushRating(zoneId: string, rating: number): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await this.db.from('user_ratings').upsert({
        user_id: uid, zone_id: zoneId, rating,
        updated_at: new Date().toISOString()
      });
    } catch {}
  }

  async pushComment(zoneId: string, comment: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await this.db.from('user_comments').upsert({
        user_id: uid, zone_id: zoneId, comment,
        initiales: this.auth.emailInitiales,
        updated_at: new Date().toISOString()
      });
    } catch {}
  }

  async pushFavoriAjout(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await this.db.from('user_favorites').upsert({ user_id: uid, zone_id: zoneId });
    } catch {}
  }

  async pushFavoriSuppression(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await this.db.from('user_favorites').delete().eq('user_id', uid).eq('zone_id', zoneId);
    } catch {}
  }

  // ── Reset : supprime toutes les données cloud de l'utilisateur ────────────

  async resetAll(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    try {
      await Promise.all([
        this.db.from('user_badges')   .delete().eq('user_id', uid),
        this.db.from('user_ratings')  .delete().eq('user_id', uid),
        this.db.from('user_comments') .delete().eq('user_id', uid),
        this.db.from('user_favorites').delete().eq('user_id', uid),
      ]);
    } catch {}
  }
}
