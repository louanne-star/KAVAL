import { Injectable, signal, computed } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _user           = signal<User | null>(null);
  private _sessionLoaded  = false;
  private _sessionPromise: Promise<void>;

  readonly user        = this._user.asReadonly();
  readonly estConnecte = computed(() => this._user() !== null);

  constructor(private supabase: SupabaseService) {
    // Restaure la session existante (JWT stocké localement)
    this._sessionPromise = this.supabase.getCurrentUser().then(user => {
      this._user.set(user);
      this._sessionLoaded = true;
    });

    // Écoute les changements d'état auth (login / logout / refresh token)
    this.supabase.client.auth.onAuthStateChange((_, session) => {
      this._user.set(session?.user ?? null);
    });
  }

  /** Attend la résolution de la session avant de prendre une décision de routing. */
  waitForSession(): Promise<void> {
    return this._sessionPromise;
  }

  get userId(): string | null {
    return this._user()?.id ?? null;
  }

  async seConnecter(email: string, motDePasse: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email, password: motDePasse
    });
    if (error) throw error;
    this._user.set(data.user);
  }

  /**
   * Retourne `true` si une session a bien été créée (utilisateur connecté).
   * Si la confirmation par e-mail est activée côté Supabase, `data.user` est
   * renvoyé non-nul mais `data.session` reste `null` tant que le lien reçu
   * par e-mail n'a pas été cliqué — dans ce cas on ne met pas à jour `_user`,
   * sinon l'app croit l'utilisateur connecté jusqu'au prochain rechargement.
   */
  async sInscrire(email: string, motDePasse: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email, password: motDePasse
    });
    if (error) throw error;
    const sessionCreee = data.session !== null;
    if (sessionCreee) this._user.set(data.user);
    return sessionCreee;
  }

  async seDeconnecter(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
  }

  async modifierMotDePasse(nouveauMdp: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password: nouveauMdp });
    if (error) throw error;
  }

  /**
   * Envoie l'e-mail de réinitialisation. Ne renvoie jamais d'erreur si
   * l'adresse n'existe pas (comportement natif de Supabase) : ça évite de
   * laisser un attaquant deviner quels e-mails ont un compte chez nous.
   */
  async demanderReinitialisation(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    if (error) throw error;
  }

  /**
   * À appeler sur la page de réinitialisation : confirme qu'une session de
   * récupération valide a bien été établie à partir du lien reçu par e-mail
   * (sans dépendre du timing de l'évènement PASSWORD_RECOVERY, qui peut être
   * émis avant que la page n'ait fini de s'initialiser).
   */
  async verifierSessionRecuperation(): Promise<boolean> {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session !== null;
  }

  async supprimerCompte(): Promise<void> {
    const { error } = await this.supabase.client.rpc('delete_account');
    if (error) throw error;
    this._user.set(null);
  }

  async mettreAJourEmoji(emoji: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ data: { avatar_emoji: emoji } });
    if (error) throw error;
    const { data } = await this.supabase.client.auth.getUser();
    this._user.set(data.user);
  }

  async mettreAJourUsername(username: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ data: { username } });
    if (error) throw error;
    const { data } = await this.supabase.client.auth.getUser();
    this._user.set(data.user);
  }

  get avatarEmoji(): string | null {
    return this._user()?.user_metadata?.['avatar_emoji'] ?? null;
  }

  get username(): string | null {
    return this._user()?.user_metadata?.['username'] ?? null;
  }

  get emailInitiales(): string {
    const email = this._user()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  }
}
