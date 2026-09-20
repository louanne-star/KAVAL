import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, languageOutline, lockClosedOutline, trashOutline } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { JourneyService } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { PointsService } from '../../services/points.service';
import { LanguageService } from '../../services/language.service';
import { Langue } from '../../i18n/translations';

type Vue = 'profil' | 'mdp';

@Component({
  selector: 'app-compte',
  templateUrl: './compte.page.html',
  styleUrls: ['./compte.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
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

  // Identité (le pseudonyme vit dans user_metadata Supabase, propre à chaque compte)
  readonly username = computed(() => this.auth.username);
  editingUsername   = signal(false);
  usernameTemp      = '';

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
    readonly languageService: LanguageService,
    private translate:        TranslateService,
    private router:           Router,
  ) {
    addIcons({ personOutline, languageOutline, lockClosedOutline, trashOutline });
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
      this.succes.set(this.translate.instant('compte.messages.avatarOk'));
      setTimeout(() => this.succes.set(null), 3000);
    } catch {
      this.erreur.set(this.translate.instant('compte.messages.avatarErreur'));
    } finally {
      this.chargement.set(false);
    }
  }

  // ── Username ─────────────────────────────────────────────────────────────────

  commencerEditUsername() {
    this.usernameTemp = this.username() ?? '';
    this.editingUsername.set(true);
  }

  async sauvegarderUsername() {
    const val = this.usernameTemp.trim();
    this.editingUsername.set(false);
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      await this.auth.mettreAJourUsername(val);
      this.succes.set(this.translate.instant('compte.messages.usernameOk'));
      setTimeout(() => this.succes.set(null), 3000);
    } catch {
      this.erreur.set(this.translate.instant('compte.messages.avatarErreur'));
    } finally {
      this.chargement.set(false);
    }
  }

  // ── Préférences ───────────────────────────────────────────────────────────────

  changerLangue(l: Langue) {
    this.languageService.changerLangue(l);
  }

  // ── MDP ──────────────────────────────────────────────────────────────────────

  async modifierMdp() {
    if (!this.nouveauMdp || this.nouveauMdp !== this.confirmMdp) {
      this.erreur.set(this.translate.instant('compte.messages.mdpMismatch'));
      return;
    }
    if (this.nouveauMdp.length < 6) {
      this.erreur.set(this.translate.instant('compte.messages.mdpTropCourt'));
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      await this.auth.modifierMotDePasse(this.nouveauMdp);
      this.nouveauMdp = '';
      this.confirmMdp = '';
      this.succes.set(this.translate.instant('compte.messages.mdpOk'));
      setTimeout(() => { this.succes.set(null); this.vue.set('profil'); }, 2000);
    } catch {
      this.erreur.set(this.translate.instant('compte.messages.mdpErreur'));
    } finally {
      this.chargement.set(false);
    }
  }

  // ── Compte ────────────────────────────────────────────────────────────────────

  async supprimerCompte() {
    this.chargement.set(true);
    try {
      await this.auth.supprimerCompte();
      this.confirmSuppr.set(false);
      this.chargement.set(false);
      this.succes.set(this.translate.instant('compte.messages.supprOk'));
      setTimeout(() => this.router.navigate(['/login'], { replaceUrl: true }), 1200);
    } catch {
      this.confirmSuppr.set(false); // sinon le toast d'erreur reste caché derrière la feuille
      this.erreur.set(this.translate.instant('compte.messages.supprErreur'));
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
