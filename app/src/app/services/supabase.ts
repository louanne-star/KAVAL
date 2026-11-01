// Crée le client Supabase (base de données, authentification, fichiers) une
// seule fois pour toute l'app. Tous les autres services passent par
// `supabase.client` pour parler à la base — c'est le seul endroit qui connaît
// l'URL et la clé du projet (voir environments/environment.ts).
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}