import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { JourneyService, JourneyZone } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';

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

  readonly META: Record<string, { icone: string; sousTitre: string; jeu?: string }> = {
    camp_est:    { icone: '⛏️',  sousTitre: 'Carrière & industrie' },
    vacherie:    { icone: '🌾', sousTitre: 'Agriculture & libérés' },
    hopital:     { icone: '✝️', sousTitre: 'Soins & chapelle' },
    penitencier: { icone: '🗝️', sousTitre: 'Cœur du bagne', jeu: 'assets/mini-jeux/river_jump.html' },
    ferme_nord:  { icone: '🌊', sousTitre: 'Phare & léproserie' },
  };

  private paramSub?: Subscription;
  private readonly onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'jeuTermine' && this.zoneSelectionnee) {
      this.ngZone.run(async () => {
        this.jeuOuvert = false;
        await this.badgeService.gagnerBadge(this.zoneSelectionnee!.id);
        this.badgeAnimation = true;
        setTimeout(() => { this.badgeAnimation = false; }, 3000);
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
  }

  get jeuUrl(): SafeResourceUrl | null {
    const jeu = this.zoneSelectionnee ? this.META[this.zoneSelectionnee.id]?.jeu : null;
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
