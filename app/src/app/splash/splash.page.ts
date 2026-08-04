import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SyncService } from '../services/sync.service';
import { BadgeService } from '../services/badge.service';
import { RatingService } from '../services/rating.service';
import { CommentService } from '../services/comment.service';
import { FavoriteService } from '../services/favorite.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {

  visible = false;

  constructor(
    private router:   Router,
    private auth:     AuthService,
    private sync:     SyncService,
    private badges:   BadgeService,
    private ratings:  RatingService,
    private comments: CommentService,
    private favoris:  FavoriteService,
  ) {}

  async ngOnInit() {
    setTimeout(() => (this.visible = true), 100);

    // Attend la résolution de la session Supabase (JWT local)
    await this.auth.waitForSession();

    setTimeout(async () => {
      if (this.auth.estConnecte()) {
        // Sync silencieux en arrière-plan (ne bloque pas si hors-ligne)
        this.syncEnArrierePlan();
        this.router.navigate(['/tabs/carte'], { replaceUrl: true });
      } else {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    }, 2000);
  }

  private async syncEnArrierePlan() {
    try {
      if (await this.sync.estNouveauCompte()) {
        await Promise.all([
          this.badges.reinitialiser(),
          this.ratings.reinitialiser(),
          this.comments.reinitialiser(),
          this.favoris.reinitialiser(),
        ]);
      }

      const data = await this.sync.syncAll();
      if (!data) return;
      await Promise.all([
        this.badges.chargerDepuisCloud(data.badges),
        this.ratings.chargerDepuisCloud(data.ratings),
        this.comments.chargerDepuisCloud(data.comments),
        this.favoris.chargerDepuisCloud(data.favoris),
      ]);
    } catch {
      // Offline ou erreur réseau — l'app continue avec les données locales
    }
  }
}
