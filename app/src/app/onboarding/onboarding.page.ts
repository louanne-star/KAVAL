import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline, arrowBackOutline, checkmarkCircle,
  mapOutline, saveOutline, refreshOutline, ribbonOutline, sparklesOutline,
  personOutline, location,
} from 'ionicons/icons';
import { Preferences } from '../core/preferences';
import { CLE_ONBOARDING_TERMINE } from './onboarding.constants';
import { BrandingService } from '../services/branding.service';
import { EquipeService } from '../services/equipe.service';
import { LanguageService } from '../services/language.service';

type EtatPermission = 'inconnu' | 'en_cours' | 'accordee' | 'refusee' | 'indisponible';

// Index (0-based) de l'écran localisation : la progression y est bloquée
// tant que la permission GPS n'est pas accordée.
const INDEX_ECRAN_LOCALISATION = 1;
const NB_ECRANS = 5;

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
})
export class OnboardingPage implements AfterViewInit, OnDestroy {

  @ViewChild('piste') pisteRef!: ElementRef<HTMLElement>;

  readonly ecrans = Array.from({ length: NB_ECRANS }, (_, i) => i);

  indexActif = signal(0);
  permission = signal<EtatPermission>('inconnu');
  messagePermission = signal<string | null>(null);

  readonly avantages = [
    { num: '01', cle: 'progression',   icone: 'save-outline' },
    { num: '02', cle: 'parcours',      icone: 'refresh-outline' },
    { num: '03', cle: 'badges',        icone: 'ribbon-outline' },
    { num: '04', cle: 'personnaliser', icone: 'sparkles-outline' },
  ];

  // nom : raison sociale, ne se traduit pas. role : clé de traduction.
  readonly collaborateurs = [
    { role: 'encadrement', nom: 'Université de la Nouvelle-Calédonie' },
    { role: 'sources',     nom: 'Association Témoignage d\'Un Passé' },
  ];

  private scrollTimeout?: ReturnType<typeof setTimeout>;
  private readonly onScrollBound = () => this.onScroll();

  constructor(
    private router: Router,
    private translate: TranslateService,
    readonly branding: BrandingService,
    readonly equipe: EquipeService,
    readonly languageService: LanguageService,
  ) {
    addIcons({
      arrowForwardOutline, arrowBackOutline, checkmarkCircle,
      mapOutline, saveOutline, refreshOutline, ribbonOutline, sparklesOutline,
      personOutline, location,
    });
    this.verifierPermissionExistante();
  }

  ngAfterViewInit() {
    this.pisteRef.nativeElement.addEventListener('scroll', this.onScrollBound, { passive: true });
  }

  ngOnDestroy() {
    this.pisteRef?.nativeElement.removeEventListener('scroll', this.onScrollBound);
    clearTimeout(this.scrollTimeout);
  }

  private async verifierPermissionExistante() {
    if (!('permissions' in navigator)) return;
    try {
      const status = await (navigator as any).permissions.query({ name: 'geolocation' });
      if (status.state === 'granted') this.permission.set('accordee');
      else if (status.state === 'denied') this.permission.set('refusee');
    } catch {
      // API Permissions non supportée (ex. Safari) — on se fiera uniquement
      // au résultat de l'appel getCurrentPosition lors du clic sur "Autoriser".
    }
  }

  private onScroll() {
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const el = this.pisteRef.nativeElement;
      const i = Math.round(el.scrollLeft / el.clientWidth);

      // Verrou : impossible de rester sur l'écran suivant la localisation
      // (ou au-delà) tant que la permission n'est pas accordée.
      if (i > INDEX_ECRAN_LOCALISATION && this.permission() !== 'accordee') {
        this.allerA(INDEX_ECRAN_LOCALISATION);
        this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.requise'));
        return;
      }

      this.indexActif.set(i);
    }, 90);
  }

  allerA(i: number) {
    const cible = Math.max(0, Math.min(NB_ECRANS - 1, i));
    if (cible > INDEX_ECRAN_LOCALISATION && this.permission() !== 'accordee') {
      this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.requise'));
      return;
    }
    const el = this.pisteRef.nativeElement;
    el.scrollTo({ left: cible * el.clientWidth, behavior: 'smooth' });
    this.indexActif.set(cible);
  }

  suivant()   { this.allerA(this.indexActif() + 1); }
  precedent() { this.allerA(this.indexActif() - 1); }

  // Le switch sert aussi de bouton : un clic déclenche la vraie demande de
  // permission navigateur (accordée/en cours ne sont pas cliquables, le
  // <button> est alors [disabled]).
  onToggleLocalisation() {
    this.demanderPermission();
  }

  demanderPermission() {
    if (!('geolocation' in navigator)) {
      this.permission.set('indisponible');
      this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.indisponible'));
      return;
    }

    this.permission.set('en_cours');
    this.messagePermission.set(null);

    navigator.geolocation.getCurrentPosition(
      () => {
        this.permission.set('accordee');
        this.messagePermission.set(null);
        setTimeout(() => this.suivant(), 500);
      },
      (err) => {
        this.permission.set('refusee');
        if (err.code === err.PERMISSION_DENIED) {
          this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.refusee'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.introuvable'));
        } else {
          this.messagePermission.set(this.translate.instant('onboarding.localisation.erreurs.expiree'));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  changerLangue(langue: 'fr' | 'en') {
    this.languageService.changerLangue(langue);
  }

  async terminer(destination: 'inscription' | 'connexion') {
    await Preferences.set({ key: CLE_ONBOARDING_TERMINE, value: '1' });
    this.router.navigate(['/login'], { queryParams: { tab: destination }, replaceUrl: true });
  }
}
