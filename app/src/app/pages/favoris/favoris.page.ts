import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { JourneyService } from '../../services/journey.service';
import { FavoriteService } from '../../services/favorite.service';
import { BadgeService } from '../../services/badge.service';
import { RatingService } from '../../services/rating.service';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-favoris',
  templateUrl: './favoris.page.html',
  styleUrls: ['./favoris.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class FavorisPage {

  readonly zonesFavorites = computed(() =>
    this.journeyService.zones().filter(z => this.favoriteService.estFavori(z.id))
  );

  constructor(
    readonly journeyService:  JourneyService,
    readonly favoriteService: FavoriteService,
    readonly badgeService:    BadgeService,
    readonly ratingService:   RatingService,
    readonly pointsService:   PointsService,
    private router:           Router,
  ) {}

  retour() {
    this.router.navigate(['/tabs/carte']);
  }

  allerVersCarte(zoneId: string) {
    this.router.navigate(['/tabs/carte'], { queryParams: { zone: zoneId } });
  }

  async toggleFavori(zoneId: string) {
    await this.favoriteService.toggle(zoneId);
  }

  starsFor(note: number | null): string {
    if (!note) return '☆☆☆☆☆';
    const n = Math.round(note);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}
