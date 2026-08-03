import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { JourneyService } from '../../services/journey.service';
import { PointsService } from '../../services/points.service';

type Vue = 'profil' | 'mdp';

@Component({
  selector: 'app-compte',
  templateUrl: './compte.page.html',
  styleUrls: ['./compte.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ComptePage {

  readonly emojis = [
    '🐺','🦊','🐱','🐶','🐻','🐼','🦁','🐸',
    '🦋','🌺','🎭','⚡','🔥','⭐','🌙','🌊',
    '🧭','⚓','🗝️','⛏️','🏴','🗺️','🌴','🦜',
    '🐙','🦈','🐬','🦅','🦩','🌵','🍀','🎸',
  ];

  vue          = signal<Vue>('profil');
  chargement   = signal(false);
  erreur       = signal<string | null>(null);
  succes       = signal<string | null>(null);
  confirmSuppr = signal(false);
  voirPicker   = signal(false);

  nouveauMdp = '';
  confirmMdp = '';

  readonly zonesFavorites = computed(() =>
    this.journeyService.zones().filter(z => this.favoriteService.estFavori(z.id))
  );

  constructor(
    readonly auth:           AuthService,
    readonly favoriteService: FavoriteService,
    readonly journeyService: JourneyService,
    readonly pointsService:  PointsService,
    private router:          Router,
  ) {}

  retour() {
    this.router.navigate(['/tabs/carte']);
  }

  async choisirEmoji(emoji: string) {
    this.voirPicker.set(false);
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      await this.auth.mettreAJourEmoji(emoji);
      this.succes.set('Avatar mis à jour !');
      setTimeout(() => this.succes.set(null), 3000);
    } catch {
      this.erreur.set('Erreur lors de la mise à jour.');
    } finally {
      this.chargement.set(false);
    }
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
