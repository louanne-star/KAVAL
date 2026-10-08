import { Component, OnInit, OnDestroy, NgZone, ViewChild, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Preferences } from '../../core/preferences';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { JourneyService, JourneyZone } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { RewardService } from '../../services/reward.service';
import { PointsService, QuizQuestion, PointImage } from '../../services/points.service';
import { UiStateService } from '../../services/ui-state.service';
import { LanguageService } from '../../services/language.service';
import { Langue } from '../../i18n/translations';

type ChoixSlot = 'bonne' | 'm1' | 'm2';

const CLE_INTRO_VUE = 'kaval_parcours_intro_vue';
// Doit correspondre au "gap" de .carrousel dans parcours.page.scss.
const CARROUSEL_GAP = 12;

// Genre de chaque point (pour "Explore le/la ..."), en français uniquement —
// pas nécessaire en anglais ("Explore" n'a pas besoin d'article.
const ARTICLE_POINT: Record<string, string> = {
  four_a_chaux:                          'le',
  magasin_a_vivre:                       'le',
  briqueterie:                           'la',
  camp_est_principal:                    'le',
  hopital_du_marais:                     "l'",
  caserne_infanterie:                    'la',
  batiment_officiers_administration:     'le',
  logement_surveillants_1ere_classe:     'le',
  logement_surveillants_militaires_maries: 'le',
  quartier_cellulaire:                   'le',
  boulevard_du_crime:                    'le',
  logement_surveillant_principal:        'le',
  chapelle_saint_thomas:                 'la',
  chateau_eau_tour_guet:                 'le',
  hotel_du_commandant:                   "l'",
};

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
  introVisible = false;
  jeuOuvert = false;
  imageAgrandie = signal<PointImage | null>(null);
  carrouselIndex = signal(0);
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

  // Mini-jeu disponible pour un point précis (id du point, pas la zone géographique).
  readonly JEUX: Record<string, string> = {
    camp_est_principal: 'assets/mini-jeux/tribunal.html',
    magasin_a_vivre:    'assets/mini-jeux/bagne-connect.html',
    boulangerie:         'assets/mini-jeux/river_jump.html',
    hopital_du_marais:   'assets/mini-jeux/memoire.html',
  };

  private readonly JEUX_NOMS: Record<Langue, Record<string, string>> = {
    fr: {
      camp_est_principal: 'Le tribunal',
      magasin_a_vivre:    'Connexion des forçats',
      boulangerie:         'Traverse la Rivière',
      hopital_du_marais:   'Mémoire du Bagne',
    },
    en: {
      camp_est_principal: 'The Trial',
      magasin_a_vivre:    'Convicts Connect',
      boulangerie:         'Cross the River',
      hopital_du_marais:   'Memory of the Penal Colony',
    },
  };

  nomJeu(pointId: string): string {
    return this.JEUX_NOMS[this.languageService.langue()][pointId] ?? '';
  }

  // Phrase du badge de victoire : une par mini-jeu, pas une seule phrase
  // générique ("Tu as traversé la rivière" n'a aucun sens après le jeu de
  // mémoire ou le tribunal). Repli sur 'parcours.badge.sousTitre' (générique)
  // si un point n'a pas (encore) de mini-jeu associé ici.
  private readonly BADGE_SOUS_TITRES: Record<Langue, Record<string, string>> = {
    fr: {
      camp_est_principal: 'Tu as rendu ton verdict.',
      magasin_a_vivre:    'Tu as reconnecté les forçats.',
      boulangerie:         'Tu as traversé la rivière.',
      hopital_du_marais:   'Tu as testé ta mémoire.',
    },
    en: {
      camp_est_principal: 'You delivered your verdict.',
      magasin_a_vivre:    'You reconnected the convicts.',
      boulangerie:         'You crossed the river.',
      hopital_du_marais:   'You tested your memory.',
    },
  };

  sousTitreBadge(): string {
    if (!this.zoneSelectionnee) return '';
    const parLangue = this.BADGE_SOUS_TITRES[this.languageService.langue()];
    return parLangue[this.zoneSelectionnee.id] ?? this.translate.instant('parcours.badge.sousTitre');
  }

  private paramSub?: Subscription;
  private readonly onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'jeuTermine' && this.zoneSelectionnee) {
      this.ngZone.run(async () => {
        this.setJeuOuvert(false);
        await this.badgeService.gagnerBadge(this.zoneSelectionnee!.id);
        await this.rewardService.gagnerJeu(this.zoneSelectionnee!.id);
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
    readonly rewardService: RewardService,
    readonly pointsService: PointsService,
    readonly languageService: LanguageService,
    private uiState: UiStateService,
    private translate: TranslateService,
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
        this.carrouselIndex.set(0);
        this.initQuiz();
        this.scrollHautDetail();
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

    Preferences.get({ key: CLE_INTRO_VUE }).then(({ value }) => {
      if (!value) this.introVisible = true;
    });
  }

  fermerIntro() {
    this.introVisible = false;
    Preferences.set({ key: CLE_INTRO_VUE, value: '1' });
  }

  /** Article ("le"/"la"/"l'") à mettre devant le nom du point, en français uniquement. */
  articlePoint(pointId: string): string {
    if (this.languageService.langue() !== 'fr') return '';
    const article = ARTICLE_POINT[pointId] ?? 'le';
    return article === "l'" ? article : article + ' ';
  }

  // Halo pastel en fond de carte d'étape, une teinte fixe par zone (pas par
  // étape) pour casser le monochrome bleu sans transformer l'app en
  // patchwork multicolore : Camp Est = sable, Hôpital du Marais = lavande,
  // Zone Pénitentiaire = turquoise.
  private static readonly HALOS_PAR_ZONE: Record<string, string> = {
    camp_est: 'sable',
    hopital: 'lavande',
    penitencier: 'turquoise',
  };
  haloClasse(zoneId: string): string {
    return 'jdb-carte--halo-' + (ParcoursPage.HALOS_PAR_ZONE[zoneId] ?? 'turquoise');
  }

  progressPourcent(): number {
    const total = this.journeyService.zones().length;
    return total ? (this.badgeService.badges().size / total) * 100 : 0;
  }

  // Le drapeau avance avec la progression, mais reste clampé avant le "?" de
  // fin de piste pour ne jamais se superposer avec lui (même à 100%).
  progressFlagPourcent(): number {
    return Math.min(this.progressPourcent(), 94);
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
    const jeu = this.zoneSelectionnee ? this.JEUX[this.zoneSelectionnee.id] : null;
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

  // Le détail d'un point partage le même IonContent que la liste : sans ça,
  // le scroll reste là où était la liste (souvent en bas) et le détail
  // s'ouvre au milieu/en bas au lieu du haut.
  private scrollHautDetail() {
    setTimeout(() => {
      this.ionContent?.scrollToPoint(0, 0, 0);
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

  agrandirImage(img: PointImage) { this.imageAgrandie.set(img); }
  fermerImageAgrandie() { this.imageAgrandie.set(null); }

  // Carte centrée la plus proche du scroll actuel, pour mettre à jour les points de pagination.
  onScrollCarrousel(e: Event) {
    const el = e.target as HTMLElement;
    const carte = el.children[0] as HTMLElement | undefined;
    if (!carte) return;
    const pas = carte.offsetWidth + CARROUSEL_GAP;
    const i = Math.round(el.scrollLeft / pas);
    this.carrouselIndex.set(Math.max(0, Math.min(i, el.children.length - 1)));
  }

  allerVersPhoto(el: HTMLElement, i: number) {
    (el.children[i] as HTMLElement | undefined)?.scrollIntoView({
      behavior: 'smooth', inline: 'center', block: 'nearest',
    });
  }
}
