import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { JourneyService } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { FavoriteService } from '../../services/favorite.service';
import { RatingService } from '../../services/rating.service';
import { PointsService } from '../../services/points.service';

type Filtre = 'tous' | 'visites' | 'favoris';

@Component({
  selector: 'app-recherche',
  templateUrl: './recherche.page.html',
  styleUrls: ['./recherche.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RecherchePage implements OnInit {

  terme   = signal('');
  filtre  = signal<Filtre>('tous');

  readonly resultats = computed(() => {
    const t = this.terme().toLowerCase().trim();
    const f = this.filtre();
    return this.journeyService.zones().filter(zone => {
      const texte = `${zone.nom} ${this.pointsService.metaDe(zone.zoneId)?.sousTitre ?? ''}`.toLowerCase();
      if (t && !texte.includes(t)) return false;
      if (f === 'visites') return this.badgeService.aBadge(zone.id);
      if (f === 'favoris') return this.favoriteService.estFavori(zone.id);
      return true;
    });
  });

  constructor(
    readonly journeyService:  JourneyService,
    readonly badgeService:    BadgeService,
    readonly favoriteService: FavoriteService,
    readonly ratingService:   RatingService,
    readonly pointsService:   PointsService,
    private router:           Router,
  ) {}

  ngOnInit() {
    this.ratingService.chargerMoyennes();
  }

  retour() {
    this.router.navigate(['/tabs/carte']);
  }

  allerVersZone(zoneId: string) {
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zoneId } });
  }

  allerVersCarte(zoneId: string) {
    this.router.navigate(['/tabs/carte'], { queryParams: { zone: zoneId } });
  }

  starsFor(note: number | null): string {
    if (!note) return '☆☆☆☆☆';
    const n = Math.round(note);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}
