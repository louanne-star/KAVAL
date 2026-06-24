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

  async sInscrire(email: string, motDePasse: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email, password: motDePasse
    });
    if (error) throw error;
    // data.user peut être null si la confirmation email est activée dans Supabase
    this._user.set(data.user);
  }

  async seDeconnecter(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
  }
}
