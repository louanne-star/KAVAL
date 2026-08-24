import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { JourneyService, JourneyZone } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { PointsService, QuizQuestion } from '../../services/points.service';
import { UiStateService } from '../../services/ui-state.service';

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

  // Quiz : une question à la fois, 3 choix mélangés (2 fausses + 1 vraie réponse)
  zoneQuiz: QuizQuestion[] = [];
  quizIndex = 0;
  quizChoixActuels: string[] = [];
  quizReponseChoisie: string | null = null;
  quizScore = 0;
  quizTermine = false;

  // Mini-jeu disponible pour tous les vrai points d'une zone visuelle donnée
  readonly JEUX: Record<string, string> = {
    penitencier: 'assets/mini-jeux/river_jump.html',
    camp_est:    'assets/mini-jeux/tribunal.html',
    hopital:     'assets/mini-jeux/bagne-connect.html',
  };

  readonly JEUX_NOMS: Record<string, string> = {
    penitencier: 'Traverse la Rivière',
    camp_est:    'Le tribunal',
    hopital:     'Connexion des forçats',
  };

  private paramSub?: Subscription;
  private readonly onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'jeuTermine' && this.zoneSelectionnee) {
      this.ngZone.run(async () => {
        this.setJeuOuvert(false);
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
    private uiState: UiStateService,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.queryParamMap.subscribe(params => {
      const zoneId = params.get('zone');
      this.zoneSelectionnee = zoneId
        ? (this.journeyService.zones().find(z => z.id === zoneId) ?? null)
        : null;
      this.setJeuOuvert(false);
      this.initQuiz();
    });
    window.addEventListener('message', this.onMessage);
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
    window.removeEventListener('message', this.onMessage);
    clearTimeout(this.badgeAnimTimeout);
    this.uiState.navMasquee.set(false); // filet de sécurité si on quitte pendant que le jeu est ouvert
  }

  private setJeuOuvert(v: boolean) {
    this.jeuOuvert = v;
    this.uiState.navMasquee.set(v);
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
    this.setJeuOuvert(false);
    this.initQuiz();
  }

  retourListe() {
    const pointId = this.zoneSelectionnee?.id;
    this.setJeuOuvert(false);
    this.router.navigate(['/tabs/carte'], { queryParams: pointId ? { point: pointId } : {} });
  }

  private initQuiz() {
    this.zoneQuiz = this.zoneSelectionnee ? this.pointsService.quizDe(this.zoneSelectionnee.id) : [];
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizTermine = false;
    this.quizReponseChoisie = null;
    this.melangerChoixActuels();
  }

  private melangerChoixActuels() {
    const q = this.zoneQuiz[this.quizIndex];
    if (!q) { this.quizChoixActuels = []; return; }
    const choix = [q.bonneReponse, q.mauvaiseReponse1, q.mauvaiseReponse2];
    for (let i = choix.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choix[i], choix[j]] = [choix[j], choix[i]];
    }
    this.quizChoixActuels = choix;
  }

  choisirReponse(choix: string) {
    if (this.quizReponseChoisie) return;
    this.quizReponseChoisie = choix;
    if (choix === this.zoneQuiz[this.quizIndex].bonneReponse) this.quizScore++;
  }

  questionSuivante() {
    if (this.quizIndex < this.zoneQuiz.length - 1) {
      this.quizIndex++;
      this.quizReponseChoisie = null;
      this.melangerChoixActuels();
    } else {
      this.quizTermine = true;
    }
  }

  recommencerQuiz() {
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizTermine = false;
    this.quizReponseChoisie = null;
    this.melangerChoixActuels();
  }

  retourCarte() {
    this.router.navigate(['/tabs/carte']);
  }

  ouvrirJeu() { this.setJeuOuvert(true); }
  fermerJeu() { this.setJeuOuvert(false); }
}
