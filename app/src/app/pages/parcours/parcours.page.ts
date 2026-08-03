import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { JourneyService, JourneyZone } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-parcours',
  templateUrl: './parcours.page.html',
  styleUrls: ['./parcours.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class ParcoursPage implements OnInit, OnDestroy {

  zoneSelectionnee: JourneyZone | null = null;
  jeuOuvert = false;
  badgeAnimation = false;
  private badgeAnimTimeout?: ReturnType<typeof setTimeout>;

  // Mini-jeu disponible pour tous les vrai points d'une zone visuelle donnée
  readonly JEUX: Record<string, string> = {
    penitencier: 'assets/mini-jeux/river_jump.html',
  };

  readonly TEMOIGNAGES: Record<string, { titre: string; auteur: string; texte: string }> = {
    camp_est_principal: {
      titre:  'L\'Enfer du Camp Est',
      auteur: 'Lucien Jossevel, forçat suisse',
      texte:  'Dépouillés de toute dignité, vêtus de simples toiles de sac et entravés par de lourds fers aux pieds, les condamnés subissent un châtiment impitoyable. Du lever au coucher du soleil, affamés par des rations de survie diminuées de moitié, ils sont forcés de marcher en rond dans une salle à une cadence effrénée, tels des chevaux de manège. Mais l\'horreur culmine lors des courtes minutes de répit. Ce soi-disant repos est une véritable torture psychologique et physique : obligés de s\'asseoir dans un silence de mort sur des billots de bois verticaux atrocement étroits, la douleur est telle que le bagnard avoue qu\'on « ferait mieux de les empaler ». Une descente aux enfers où la pause devient un supplice encore pire que l\'effort.',
    },
  };

  private paramSub?: Subscription;
  private readonly onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'jeuTermine' && this.zoneSelectionnee) {
      this.ngZone.run(async () => {
        this.jeuOuvert = false;
        await this.badgeService.gagnerBadge(this.zoneSelectionnee!.id);
        clearTimeout(this.badgeAnimTimeout);
        this.badgeAnimation = false;
        setTimeout(() => {
          this.badgeAnimation = true;
          this.badgeAnimTimeout = setTimeout(() => { this.badgeAnimation = false; }, 3000);
        }, 50);
      });
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    readonly journeyService: JourneyService,
    readonly badgeService: BadgeService,
    readonly pointsService: PointsService,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.queryParamMap.subscribe(params => {
      const zoneId = params.get('zone');
      this.zoneSelectionnee = zoneId
        ? (this.journeyService.zones().find(z => z.id === zoneId) ?? null)
        : null;
      this.jeuOuvert = false;
    });
    window.addEventListener('message', this.onMessage);
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
    window.removeEventListener('message', this.onMessage);
    clearTimeout(this.badgeAnimTimeout);
  }

  get jeuUrl(): SafeResourceUrl | null {
    const jeu = this.zoneSelectionnee ? this.JEUX[this.zoneSelectionnee.zoneId] : null;
    return jeu ? this.sanitizer.bypassSecurityTrustResourceUrl(jeu) : null;
  }

  getStatut(zone: JourneyZone): 'visite' | 'actif' | 'locked' {
    if (!zone.debloque) return 'locked';
    return this.badgeService.aBadge(zone.id) ? 'visite' : 'actif';
  }

  get zonesDebloquees(): JourneyZone[] {
    return this.journeyService.zones().filter(z => z.debloque);
  }

  selectZone(zone: JourneyZone) {
    if (this.getStatut(zone) === 'locked') return;
    this.zoneSelectionnee = zone;
    this.jeuOuvert = false;
  }

  retourListe() {
    this.zoneSelectionnee = null;
    this.jeuOuvert = false;
  }

  retourCarte() {
    this.router.navigate(['/tabs/carte']);
  }

  ouvrirJeu() { this.jeuOuvert = true; }
  fermerJeu() { this.jeuOuvert = false; }
}
