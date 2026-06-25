import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { JourneyService } from '../../services/journey.service';
import { SupabaseService } from '../../services/supabase';

type Vue = 'profil' | 'mdp';

@Component({
  selector: 'app-compte',
  templateUrl: './compte.page.html',
  styleUrls: ['./compte.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ComptePage {

  readonly META: Record<string, { icone: string; sousTitre: string }> = {
    camp_est:    { icone: '⛏️',  sousTitre: 'Carrière & industrie' },
    vacherie:    { icone: '🌾', sousTitre: 'Agriculture & libérés' },
    hopital:     { icone: '✝️', sousTitre: 'Soins & chapelle' },
    penitencier: { icone: '🗝️', sousTitre: 'Cœur du bagne' },
    ferme_nord:  { icone: '🌊', sousTitre: 'Phare & léproserie' },
  };

  vue            = signal<Vue>('profil');
  chargement     = signal(false);
  erreur         = signal<string | null>(null);
  succes         = signal<string | null>(null);
  confirmSuppr   = signal(false);

  // Modifier mot de passe
  nouveauMdp     = '';
  confirmMdp     = '';

  readonly zonesFavorites = computed(() =>
    this.journeyService.zones().filter(z => this.favoriteService.estFavori(z.id))
  );

  constructor(
    readonly auth:           AuthService,
    readonly favoriteService: FavoriteService,
    readonly journeyService: JourneyService,
    private supabase:        SupabaseService,
    private router:          Router,
  ) {}

  // ── Avatar ────────────────────────────────────────────────────────────────

  declencherUpload() {
    document.getElementById('avatar-input')?.click();
  }

  async surSelectionPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.auth.userId) return;

    this.chargement.set(true);
    this.erreur.set(null);
    try {
      // Redimensionne en 200×200 avant upload
      const blob     = await this.redimensionner(file, 200);
      const chemin   = `${this.auth.userId}.jpg`;
      const { error: upErr } = await this.supabase.client.storage
        .from('avatars').upload(chemin, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;

      const { data } = this.supabase.client.storage.from('avatars').getPublicUrl(chemin);
      await this.auth.mettreAJourAvatar(`${data.publicUrl}?t=${Date.now()}`);
      this.succes.set('Photo mise à jour !');
      setTimeout(() => this.succes.set(null), 3000);
    } catch {
      this.erreur.set('Erreur lors de l\'upload. Vérifiez que le bucket "avatars" est public.');
    } finally {
      this.chargement.set(false);
    }
  }

  private redimensionner(file: File, taille: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img    = new Image();
      const url    = URL.createObjectURL(file);
      img.onload   = () => {
        const canvas    = document.createElement('canvas');
        canvas.width    = taille;
        canvas.height   = taille;
        const ctx       = canvas.getContext('2d')!;
        const min       = Math.min(img.width, img.height);
        const ox        = (img.width  - min) / 2;
        const oy        = (img.height - min) / 2;
        ctx.drawImage(img, ox, oy, min, min, 0, 0, taille, taille);
        URL.revokeObjectURL(url);
        canvas.toBlob(b => b ? resolve(b) : reject(), 'image/jpeg', 0.85);
      };
      img.onerror = reject;
      img.src     = url;
    });
  }

  // ── Mot de passe ──────────────────────────────────────────────────────────

  async modifierMdp() {
    if (!this.nouveauMdp || this.nouveauMdp !== this.confirmMdp) {
      this.erreur.set('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.nouveauMdp.length < 6) {
      this.erreur.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      await this.auth.modifierMotDePasse(this.nouveauMdp);
      this.nouveauMdp = '';
      this.confirmMdp = '';
      this.succes.set('Mot de passe modifié !');
      setTimeout(() => { this.succes.set(null); this.vue.set('profil'); }, 2000);
    } catch {
      this.erreur.set('Erreur lors de la modification.');
    } finally {
      this.chargement.set(false);
    }
  }

  // ── Suppression ───────────────────────────────────────────────────────────

  async supprimerCompte() {
    this.chargement.set(true);
    try {
      await this.auth.supprimerCompte();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch {
      this.erreur.set('Erreur lors de la suppression.');
      this.chargement.set(false);
    }
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────

  async seDeconnecter() {
    await this.auth.seDeconnecter();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  allerVersZone(zoneId: string) {
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zoneId } });
  }

  changerVue(v: Vue) {
    this.vue.set(v);
    this.erreur.set(null);
    this.succes.set(null);
  }
}
