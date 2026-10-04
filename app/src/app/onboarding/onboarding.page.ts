import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
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
  imports: [CommonModule, IonicModule],
})
export class OnboardingPage implements AfterViewInit, OnDestroy {

  @ViewChild('piste') pisteRef!: ElementRef<HTMLElement>;

  readonly ecrans = Array.from({ length: NB_ECRANS }, (_, i) => i);

  indexActif = signal(0);
  permission = signal<EtatPermission>('inconnu');
  messagePermission = signal<string | null>(null);

  readonly avantages = [
    { num: '01', titre: 'Sauvegarder ta progression', icone: 'save-outline' },
    { num: '02', titre: 'Retrouver ton parcours', icone: 'refresh-outline' },
    { num: '03', titre: 'Débloquer tes badges', icone: 'ribbon-outline' },
    { num: '04', titre: 'Personnaliser ton expérience', icone: 'sparkles-outline' },
  ];

  readonly collaborateurs = [
    { role: 'Encadrement', nom: 'Université de la Nouvelle-Calédonie' },
    { role: 'Sources historiques', nom: 'Association Témoignage d\'Un Passé' },
  ];

  private scrollTimeout?: ReturnType<typeof setTimeout>;
  private readonly onScrollBound = () => this.onScroll();

  constructor(private router: Router, readonly branding: BrandingService, readonly equipe: EquipeService) {
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
        this.messagePermission.set('Autorise ta position pour continuer.');
        return;
      }

      this.indexActif.set(i);
    }, 90);
  }

  allerA(i: number) {
    const cible = Math.max(0, Math.min(NB_ECRANS - 1, i));
    if (cible > INDEX_ECRAN_LOCALISATION && this.permission() !== 'accordee') {
      this.messagePermission.set('Autorise ta position pour continuer.');
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
      this.messagePermission.set('Géolocalisation indisponible sur cet appareil.');
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
          this.messagePermission.set('Autorisation refusée. Vérifie les réglages de ton navigateur, puis réessaie.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          this.messagePermission.set('Position introuvable. Vérifie que ta localisation est activée.');
        } else {
          this.messagePermission.set('La demande a expiré. Réessaie.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  async terminer(destination: 'inscription' | 'connexion') {
    await Preferences.set({ key: CLE_ONBOARDING_TERMINE, value: '1' });
    this.router.navigate(['/login'], { queryParams: { tab: destination }, replaceUrl: true });
  }
}
