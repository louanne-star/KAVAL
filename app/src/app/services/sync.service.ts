import { Injectable, signal } from '@angular/core';
import { Preferences } from '../core/preferences';
import { SupabaseService } from './supabase';
import { AuthService } from './auth.service';

const CLE_DERNIER_UID       = 'kaval_dernier_uid';
const CLE_ERREUR_EN_ATTENTE = 'kaval_sync_erreur_attente';

export interface DonneesCloud {
  badges:   string[];
  ratings:  Record<string, number>;
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

  // true si un push a échoué récemment (hors-ligne, Supabase indisponible)
  // et n'a pas encore été rejoué avec succès — piloté par pousser() ci-dessous,
  // affiché par un petit bandeau global (app.component).
  readonly enErreur = signal(false);

  // ── Logging + suivi d'erreur communs à tous les push ───────────────────────
  // Avant : chaque push avait son propre `catch {}` vide — et même celui-là
  // ne servait qu'à moitié, puisque le client Supabase ne lève une exception
  // qu'en cas de panne réseau pure (fetch qui échoue) : un refus de l'API
  // (RLS, contrainte...) resterait une réponse normale avec `{ error }`
  // rempli, jamais une exception. D'où le throw explicite ci-dessous — sans
  // lui, ce genre d'échec n'aurait jamais déclenché le catch, logging ou pas.
  private async pousser(operation: () => PromiseLike<{ error: any }>, contexte: string): Promise<void> {
    try {
      const { error } = await operation();
      if (error) throw error;
      if (this.enErreur()) {
        this.enErreur.set(false);
        await Preferences.remove({ key: CLE_ERREUR_EN_ATTENTE });
      }
    } catch (err) {
      console.error(`[Sync] ${contexte} a échoué`, err);
      this.enErreur.set(true);
      await Preferences.set({ key: CLE_ERREUR_EN_ATTENTE, value: '1' });
    }
  }

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
      const [b, r, f] = await Promise.all([
        this.db.from('user_badges')   .select('zone_id')         .eq('user_id', uid),
        this.db.from('user_ratings')  .select('zone_id,rating')  .eq('user_id', uid),
        this.db.from('user_favorites').select('zone_id')         .eq('user_id', uid),
      ]);
      return {
        badges:   (b.data ?? []).map((row: any) => row.zone_id as string),
        ratings:  (r.data ?? []).reduce((acc: Record<string, number>,  row: any) => { acc[row.zone_id] = row.rating;  return acc; }, {}),
        favoris:  (f.data ?? []).map((row: any) => row.zone_id as string),
      };
    } catch (err) {
      console.error('[Sync] syncAll (pull) a échoué', err);
      return null;
    }
  }

  // ── Push : envoie une donnée en arrière-plan (silencieux si hors-ligne) ───

  async pushBadge(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    await this.pousser(
      () => this.db.from('user_badges').upsert({ user_id: uid, zone_id: zoneId }),
      `badge ${zoneId}`,
    );
  }

  async pushRating(zoneId: string, rating: number): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    await this.pousser(
      () => this.db.from('user_ratings').upsert({
        user_id: uid, zone_id: zoneId, rating,
        updated_at: new Date().toISOString()
      }),
      `note ${zoneId}`,
    );
  }

  // Chaque appel crée une nouvelle ligne (un utilisateur peut laisser
  // plusieurs commentaires sur le même point) — voir migrations_comments_multiples.sql.
  async pushComment(zoneId: string, comment: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    await this.pousser(
      () => this.db.from('user_comments').insert({
        user_id: uid, zone_id: zoneId, comment,
        initiales: this.auth.emailInitiales,
        updated_at: new Date().toISOString()
      }),
      `commentaire ${zoneId}`,
    );
  }

  async pushFavoriAjout(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    await this.pousser(
      () => this.db.from('user_favorites').upsert({ user_id: uid, zone_id: zoneId }),
      `ajout favori ${zoneId}`,
    );
  }

  async pushFavoriSuppression(zoneId: string): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    await this.pousser(
      () => this.db.from('user_favorites').delete().eq('user_id', uid).eq('zone_id', zoneId),
      `suppression favori ${zoneId}`,
    );
  }

  // ── Reconciliation : filet de sécurité au prochain lancement ───────────────
  // Si un push a échoué silencieusement (hors-ligne, Supabase indisponible),
  // on retente de pousser l'état local actuel — badges/notes/favoris ajoutés
  // uniquement, car ce sont de simples upserts (rejouables sans risque de
  // doublon), contrairement aux commentaires (insert d'une nouvelle ligne à
  // chaque appel) qu'on ne retente donc jamais automatiquement ici.
  async reconcilierSiNecessaire(badges: Set<string>, ratings: Record<string, number>, favoris: Set<string>): Promise<void> {
    const { value } = await Preferences.get({ key: CLE_ERREUR_EN_ATTENTE });
    if (!value) return;
    await Promise.all([
      ...[...badges].map(id => this.pushBadge(id)),
      ...Object.entries(ratings).map(([id, note]) => this.pushRating(id, note)),
      ...[...favoris].map(id => this.pushFavoriAjout(id)),
    ]);
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
    } catch (err) {
      console.error('[Sync] resetAll a échoué', err);
    }
  }
}
