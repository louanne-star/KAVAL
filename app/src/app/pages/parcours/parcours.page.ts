import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { JourneyService, JourneyZone } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { PointsService, QuizQuestion } from '../../services/points.service';
import { UiStateService } from '../../services/ui-state.service';
import { LanguageService } from '../../services/language.service';
import { Langue } from '../../i18n/translations';

type ChoixSlot = 'bonne' | 'm1' | 'm2';

@Component({
  selector: 'app-parcours',
  templateUrl: './parcours.page.html',
  styleUrls: ['./parcours.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, TranslatePipe]
})
export class ParcoursPage implements OnInit, OnDestroy {

  @ViewChild(IonContent) private ionContent?: IonContent;
  // Position de scroll de la liste au moment où on ouvre un point, pour la
  // restaurer au retour (le composant n'est jamais détruit entre-temps :
  // même route, seul le query param "zone" change).
  private scrollListe = 0;

  zoneSelectionnee: JourneyZone | null = null;
  enRedirection = false;
  jeuOuvert = false;
  badgeAnimation = false;
  private badgeAnimTimeout?: ReturnType<typeof setTimeout>;

  // Quiz : une question à la fois, 3 choix mélangés (2 fausses + 1 vraie réponse).
  // On mélange des "slots" (bonne/m1/m2) plutôt que le texte directement, pour
  // que l'affichage reste cohérent si la langue change en cours de quiz.
  zoneQuiz: QuizQuestion[] = [];
  quizIndex = 0;
  quizChoixActuels: ChoixSlot[] = [];
  quizReponseChoisie: ChoixSlot | null = null;
  quizScore = 0;
  quizTermine = false;

  // Mini-jeu disponible pour tous les vrai points d'une zone visuelle donnée
  readonly JEUX: Record<string, string> = {
    penitencier: 'assets/mini-jeux/river_jump.html',
    camp_est:    'assets/mini-jeux/tribunal.html',
    hopital:     'assets/mini-jeux/bagne-connect.html',
  };

  private readonly JEUX_NOMS: Record<Langue, Record<string, string>> = {
    fr: {
      penitencier: 'Traverse la Rivière',
      camp_est:    'Le tribunal',
      hopital:     'Connexion des forçats',
    },
    en: {
      penitencier: 'Cross the River',
      camp_est:    'The Trial',
      hopital:     'Convicts Connect',
    },
  };

  nomJeu(zoneId: string): string {
    return this.JEUX_NOMS[this.languageService.langue()][zoneId] ?? '';
  }

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
    private location: Location,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    readonly journeyService: JourneyService,
    readonly badgeService: BadgeService,
    readonly pointsService: PointsService,
    readonly languageService: LanguageService,
    private uiState: UiStateService,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.queryParamMap.subscribe(params => {
      const zoneId = params.get('zone');
      if (!zoneId) {
        // Pas de point précis : liste des points dans l'ordre du parcours
        // (journeyService.zones(), déjà calculé par proximité GPS — ou par
        // rapport à une position par défaut si l'utilisateur n'a pas
        // partagé sa position, voir JourneyService.construireRoute()).
        this.enRedirection = false;
        this.zoneSelectionnee = null;
        this.setJeuOuvert(false);
        this.restaurerScrollListe();
        return;
      }

      const zone = this.journeyService.zones().find(z => z.id === zoneId) ?? null;
      if (zone) {
        this.enRedirection = false;
        this.zoneSelectionnee = zone;
        this.setJeuOuvert(false);
        this.initQuiz();
      } else {
        // zones() pas encore chargées (ex: reload direct sur une page détail,
        // avant que le GPS/l'itinéraire ne soit prêt) ou id invalide : jamais
        // de "page d'attente" affichée ici, direction la carte — elle rouvrira
        // ce point automatiquement dès que ses données seront prêtes.
        this.enRedirection = true;
        this.router.navigate(['/tabs/carte'], { queryParams: { point: zoneId } });
      }
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

  // Mis en cache par chemin de jeu : le sanitizer crée un nouvel objet
  // SafeResourceUrl à chaque appel, donc si ce getter en recréait un neuf à
  // chaque cycle de détection de changement (déclenché très souvent, ex.
  // toutes les mises à jour GPS), Angular verrait une référence différente
  // et réassignerait iframe.src à chaque fois — ce qui recharge le jeu en
  // boucle, même sans changer de zone.
  private jeuUrlCache: { jeu: string; url: SafeResourceUrl } | null = null;

  get jeuUrl(): SafeResourceUrl | null {
    const jeu = this.zoneSelectionnee ? this.JEUX[this.zoneSelectionnee.zoneId] : null;
    if (!jeu) return null;
    if (this.jeuUrlCache?.jeu !== jeu) {
      this.jeuUrlCache = { jeu, url: this.sanitizer.bypassSecurityTrustResourceUrl(jeu) };
    }
    return this.jeuUrlCache.url;
  }

  // Depuis la liste : ouvre le détail d'un point. Navigue (plutôt qu'une
  // simple mutation d'état) pour que "← Retour" (Location.back()) ramène
  // bien à la liste.
  async selectZone(zone: JourneyZone) {
    const el = await this.ionContent?.getScrollElement();
    this.scrollListe = el?.scrollTop ?? 0;
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zone.id } });
  }

  // Rappelé quand on revient à la vue liste (query param "zone" retiré) :
  // le DOM de la liste vient d'être remonté par le *ngIf, on attend le
  // prochain tick pour que sa hauteur soit calculée avant de scroller.
  private restaurerScrollListe() {
    if (!this.scrollListe) return;
    setTimeout(() => {
      this.ionContent?.scrollToPoint(0, this.scrollListe, 0);
    });
  }

  // Bouton "← Retour" : comportement navigateur (retourne à la page d'où on
  // vient, quelle qu'elle soit — Carte, Recherche, Compte...) plutôt qu'une
  // redirection fixe. Quand on vient de la Carte, celle-ci rouvre la fiche
  // du point avec son zoom/centrage d'origine via UiStateService (voir
  // MapPage.explorer() et son effect de réouverture).
  retourListe() {
    this.setJeuOuvert(false);
    this.location.back();
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
    if (!this.zoneQuiz[this.quizIndex]) { this.quizChoixActuels = []; return; }
    const choix: ChoixSlot[] = ['bonne', 'm1', 'm2'];
    for (let i = choix.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choix[i], choix[j]] = [choix[j], choix[i]];
    }
    this.quizChoixActuels = choix;
  }

  texteChoix(q: QuizQuestion, slot: ChoixSlot): string {
    if (slot === 'bonne') return this.pointsService.texte(q.bonneReponse, q.bonneReponseEn);
    if (slot === 'm1')    return this.pointsService.texte(q.mauvaiseReponse1, q.mauvaiseReponse1En);
    return this.pointsService.texte(q.mauvaiseReponse2, q.mauvaiseReponse2En);
  }

  choisirReponse(slot: ChoixSlot) {
    if (this.quizReponseChoisie) return;
    this.quizReponseChoisie = slot;
    if (slot === 'bonne') this.quizScore++;
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

  ouvrirJeu() { this.setJeuOuvert(true); }
  fermerJeu() { this.setJeuOuvert(false); }
}
