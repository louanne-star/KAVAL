import { Injectable, signal } from '@angular/core';
import { Preferences } from '../core/preferences';
import { SupabaseService } from './supabase';

const CLE_CACHE = 'kaval_branding_cache';
const BUCKET = 'branding';

// Chemins des fichiers embarqués dans l'app : utilisés par défaut, tant que
// Supabase n'a pas répondu, et en repli si la table est vide/injoignable
// (hors-ligne, bucket pas encore configuré...). Voir supabase/migrations_branding.sql.
const LOGO_BLANC_LOCAL = 'assets/icon/logo-blanc.png';
const LOGO_BADGE_LOCAL = 'assets/icon/logo-badge.png';
const FOND_ONBOARDING_LOCAL = 'assets/apropos/img.jpg';

@Injectable({ providedIn: 'root' })
export class BrandingService {

  readonly logoBlanc = signal(LOGO_BLANC_LOCAL);
  readonly logoBadge = signal(LOGO_BADGE_LOCAL);
  readonly fondOnboarding = signal(FOND_ONBOARDING_LOCAL);

  constructor(private supabase: SupabaseService) {
    this.charger();
  }

  private async charger(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.from('app_branding').select('*');
      if (error) throw error;

      const cheminDe = (cle: string) => data?.find((r: any) => r.cle === cle)?.chemin as string | undefined;
      const cheminBlanc = cheminDe('logo_blanc');
      const cheminBadge = cheminDe('logo_badge');
      const cheminFond  = cheminDe('fond_onboarding');

      // Le bucket peut ne pas encore exister ou le fichier pas encore être
      // uploadé (setup manuel, voir migrations_branding.sql) : on vérifie que
      // l'image se charge vraiment avant de basculer dessus, pour ne jamais
      // afficher une icône d'image cassée.
      let miseAJour = false;
      if (cheminBlanc) {
        const url = this.urlPublique(cheminBlanc);
        if (await this.imageChargeable(url)) { this.logoBlanc.set(url); miseAJour = true; }
      }
      if (cheminBadge) {
        const url = this.urlPublique(cheminBadge);
        if (await this.imageChargeable(url)) { this.logoBadge.set(url); miseAJour = true; }
      }
      if (cheminFond) {
        const url = this.urlPublique(cheminFond);
        if (await this.imageChargeable(url)) { this.fondOnboarding.set(url); miseAJour = true; }
      }

      if (miseAJour) {
        await Preferences.set({
          key: CLE_CACHE,
          value: JSON.stringify({ blanc: this.logoBlanc(), badge: this.logoBadge(), fond: this.fondOnboarding() }),
        });
      }
    } catch {
      const { value } = await Preferences.get({ key: CLE_CACHE });
      if (!value) return; // reste sur les chemins locaux embarqués par défaut
      const cache = JSON.parse(value);
      if (cache.blanc) this.logoBlanc.set(cache.blanc);
      if (cache.badge) this.logoBadge.set(cache.badge);
      if (cache.fond) this.fondOnboarding.set(cache.fond);
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
