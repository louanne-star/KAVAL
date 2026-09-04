import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { JourneyService } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { PointsService } from '../../services/points.service';

type Vue    = 'profil' | 'mdp';
type Theme  = 'dark' | 'light';
type Langue = 'fr' | 'en';

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

  // Navigation
  vue          = signal<Vue>('profil');
  chargement   = signal(false);
  erreur       = signal<string | null>(null);
  succes       = signal<string | null>(null);
  confirmSuppr = signal(false);
  voirPicker   = signal(false);

  // Identité
  username        = signal<string>(localStorage.getItem('kaval_username') ?? '');
  editingUsername = signal(false);
  usernameTemp    = '';

  // Préférences
  theme  = signal<Theme>((localStorage.getItem('kaval_theme') as Theme) ?? 'dark');
  langue = signal<Langue>((localStorage.getItem('kaval_langue') as Langue) ?? 'fr');

  // MDP
  nouveauMdp = '';
  confirmMdp = '';

  readonly zonesFavorites = computed(() =>
    this.journeyService.zones().filter(z => this.favoriteService.estFavori(z.id))
  );

  readonly nombreZonesVisitees = computed(() =>
    this.journeyService.zones().filter(z => this.badgeService.aBadge(z.id)).length
  );

  readonly totalZones = computed(() => this.journeyService.zones().length);

  constructor(
    readonly auth:            AuthService,
    readonly favoriteService: FavoriteService,
    readonly journeyService:  JourneyService,
    readonly badgeService:    BadgeService,
    readonly pointsService:   PointsService,
    private router:           Router,
  ) {
    document.body.classList.toggle('theme-light', this.theme() === 'light');
  }

  retour() { this.router.navigate(['/tabs/carte']); }

  changerVue(v: Vue) {
    this.vue.set(v);
    this.erreur.set(null);
    this.succes.set(null);
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────

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

  // ── Username ─────────────────────────────────────────────────────────────────

  commencerEditUsername() {
    this.usernameTemp = this.username();
    this.editingUsername.set(true);
  }

  sauvegarderUsername() {
    const val = this.usernameTemp.trim();
    this.username.set(val);
    localStorage.setItem('kaval_username', val);
    this.editingUsername.set(false);
    this.succes.set('Pseudonyme mis à jour !');
    setTimeout(() => this.succes.set(null), 3000);
  }

  // ── Préférences ───────────────────────────────────────────────────────────────

  toggleTheme() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('kaval_theme', next);
    document.body.classList.toggle('theme-light', next === 'light');
  }

  changerLangue(l: Langue) {
    this.langue.set(l);
    localStorage.setItem('kaval_langue', l);
  }

  // ── MDP ──────────────────────────────────────────────────────────────────────

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

  // ── Compte ────────────────────────────────────────────────────────────────────

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

  async seDeconnecter() {
    await this.auth.seDeconnecter();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  allerVersZone(zoneId: string) {
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zoneId } });
  }
}
