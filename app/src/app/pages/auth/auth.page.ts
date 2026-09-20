import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
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
    private translate: TranslateService,
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

      // Si un autre compte a déjà été utilisé sur cet appareil, on repart d'un
      // cache local vide pour ne pas hériter de ses badges/notes/commentaires/favoris.
      if (await this.sync.estNouveauCompte()) {
        await Promise.all([
          this.badges.reinitialiser(),
          this.ratings.reinitialiser(),
          this.comments.reinitialiser(),
          this.favoris.reinitialiser(),
        ]);
      }

      // Synchronise les données cloud vers le local (silencieux si offline)
      const data = await this.sync.syncAll();
      if (data) {
        await Promise.all([
          this.badges.chargerDepuisCloud(data.badges),
          this.ratings.chargerDepuisCloud(data.ratings),
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
    if (msg.includes('Invalid login credentials')) return this.translate.instant('auth.erreurs.identifiants');
    if (msg.includes('User already registered'))   return this.translate.instant('auth.erreurs.dejaInscrit');
    if (msg.includes('Password should be'))        return this.translate.instant('auth.erreurs.motDePasseCourt');
    if (msg.includes('Unable to validate'))        return this.translate.instant('auth.erreurs.emailInvalide');
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
      return this.translate.instant('auth.erreurs.horsLigne');
    return this.translate.instant('auth.erreurs.generique');
  }
}
