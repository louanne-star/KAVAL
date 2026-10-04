import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '../core/preferences';
import { SupabaseService } from './supabase';

const CLE_CACHE = 'kaval_equipe_cache';
const BUCKET = 'equipe';

// Nombre de bulles affichées autour du logo sur l'écran "Un projet
// collaboratif" (positions CSS fixes, voir .onb-equipe-bulle). S'il y a
// moins de membres chargés que de bulles, celles en trop retombent sur la
// silhouette de repli (voir bulles()).
const NB_BULLES = 5;

export interface MembreEquipe {
  id: string;
  photoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class EquipeService {

  readonly membres = signal<MembreEquipe[]>([]);

  // Toujours NB_BULLES entrées (null = pas de photo pour ce slot, l'écran
  // affiche alors une silhouette de repli à la place).
  readonly bulles = computed(() => {
    const m = this.membres();
    return Array.from({ length: NB_BULLES }, (_, i) => m[i] ?? null);
  });

  constructor(private supabase: SupabaseService) {
    this.charger();
  }

  private async charger(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('equipe_membres')
        .select('*')
        .eq('actif', true)
        .order('ordre');
      if (error) throw error;

      // Le bucket peut ne pas encore exister ou une photo pas encore être
      // uploadée : on vérifie que chaque image se charge vraiment avant de
      // la garder, pour ne jamais afficher une icône cassée.
      const valides: MembreEquipe[] = [];
      for (const r of data ?? []) {
        const url = this.urlPublique(r.photo as string);
        if (await this.imageChargeable(url)) valides.push({ id: r.id, photoUrl: url });
      }

      if (valides.length) {
        this.membres.set(valides);
        await Preferences.set({ key: CLE_CACHE, value: JSON.stringify(valides) });
      }
    } catch {
      const { value } = await Preferences.get({ key: CLE_CACHE });
      if (value) this.membres.set(JSON.parse(value));
      // Sinon : membres() reste vide, bulles() retombe entièrement sur les silhouettes.
    }
  }

  private urlPublique(chemin: string): string {
    return this.supabase.client.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
  }

  private imageChargeable(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}
