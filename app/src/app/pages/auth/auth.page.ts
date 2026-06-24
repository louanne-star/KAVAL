import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { SyncService } from '../../services/sync.service';
import { BadgeService } from '../../services/badge.service';
import { RatingService } from '../../services/rating.service';
import { CommentService } from '../../services/comment.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AuthPage {

  onglet: 'connexion' | 'inscription' = 'connexion';

  email      = '';
  motDePasse = '';
  chargement = signal(false);
  erreur     = signal<string | null>(null);

  constructor(
    private auth:     AuthService,
    private sync:     SyncService,
    private badges:   BadgeService,
    private ratings:  RatingService,
    private comments: CommentService,
    private favoris:  FavoriteService,
    private router:   Router,
  ) {}

  basculerOnglet(onglet: 'connexion' | 'inscription') {
    this.onglet = onglet;
    this.erreur.set(null);
  }

  async soumettre() {
    if (!this.email || !this.motDePasse) {
      this.erreur.set('Veuillez remplir tous les champs.');
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);

    try {
      if (this.onglet === 'connexion') {
        await this.auth.seConnecter(this.email, this.motDePasse);
      } else {
        await this.auth.sInscrire(this.email, this.motDePasse);
      }

      // Synchronise les données cloud vers le local (silencieux si offline)
      const data = await this.sync.syncAll();
      if (data) {
        await Promise.all([
          this.badges.chargerDepuisCloud(data.badges),
          this.ratings.chargerDepuisCloud(data.ratings),
          this.comments.chargerDepuisCloud(data.comments),
          this.favoris.chargerDepuisCloud(data.favoris),
        ]);
      }

      this.router.navigate(['/tabs/carte'], { replaceUrl: true });

    } catch (err: any) {
      console.error('[Auth] Erreur Supabase :', err);
      this.erreur.set(this.traduireErreur(err?.message ?? ''));
    } finally {
      this.chargement.set(false);
    }
  }

  private traduireErreur(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('User already registered'))   return 'Un compte existe déjà avec cet email.';
    if (msg.includes('Password should be'))        return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (msg.includes('Unable to validate'))        return 'Email invalide.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
      return 'Pas de connexion internet. Reconnectez-vous plus tard.';
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
