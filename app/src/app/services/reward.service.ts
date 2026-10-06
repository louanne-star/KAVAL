import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth.service';

export interface Recompense {
  code:       string;
  pseudo:     string | null;
  utiliseeLe: string | null;
}

@Injectable({ providedIn: 'root' })
export class RewardService {
  private _jeuxGagnes = signal<Set<string>>(new Set());
  private _recompense = signal<Recompense | null>(null);
  private _totalJeux  = signal(0);

  readonly jeuxGagnes = this._jeuxGagnes.asReadonly();
  readonly recompense = this._recompense.asReadonly();
  readonly totalJeux  = this._totalJeux.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private auth:     AuthService,
  ) {}

  aGagne(pointId: string): boolean {
    return this._jeuxGagnes().has(pointId);
  }

  // Appelé uniquement depuis le message "jeuTermine" d'un mini-jeu (jamais
  // depuis l'arrivée GPS) — seul signal fiable que le joueur a vraiment gagné.
  async gagnerJeu(pointId: string): Promise<void> {
    if (this._jeuxGagnes().has(pointId)) return;
    const uid = this.auth.userId;
    if (!uid) return;

    const set = new Set(this._jeuxGagnes());
    set.add(pointId);
    this._jeuxGagnes.set(set);

    try {
      await this.supabase.client.from('user_games_won').upsert({ user_id: uid, point_id: pointId });
    } catch {}

    // Le trigger Supabase crée la récompense côté serveur dès que tous les
    // jeux sont gagnés — on recharge pour la détecter si c'est le cas.
    await this.chargerRecompense();
  }

  // Nombre total de mini-jeux à gagner — lu en base (table mini_jeux_points)
  // plutôt que codé en dur, pour qu'ajouter un futur mini-jeu n'exige qu'un
  // INSERT côté Supabase, sans toucher au code.
  async chargerTotalJeux(): Promise<void> {
    try {
      const { count } = await this.supabase.client
        .from('mini_jeux_points')
        .select('point_id', { count: 'exact', head: true });
      if (count !== null) this._totalJeux.set(count);
    } catch {}
  }

  async chargerJeuxGagnes(): Promise<void> {
    const uid = this.auth.userId;
    if (!uid) return;
    try {
      const { data } = await this.supabase.client
        .from('user_games_won')
        .select('point_id')
        .eq('user_id', uid);
      if (data) this._jeuxGagnes.set(new Set((data as { point_id: string }[]).map(r => r.point_id)));
    } catch {}
  }

  async chargerRecompense(): Promise<void> {
    try {
      const { data } = await this.supabase.client
        .from('recompenses')
        .select('code, pseudo, utilisee_le')
        .maybeSingle();
      if (data) {
        this._recompense.set({ code: data.code, pseudo: data.pseudo, utiliseeLe: data.utilisee_le });
      }
    } catch {}
  }

  async reinitialiser(): Promise<void> {
    this._jeuxGagnes.set(new Set());
    this._recompense.set(null);
  }
}
