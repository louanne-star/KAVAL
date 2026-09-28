import { Component, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TutorialService, EtapeTuto } from '../../services/tutorial.service';

// Délai avant de chercher la cible après une navigation : laisse le temps au
// routeur/à Angular de rendre la nouvelle page avant qu'on interroge le DOM.
const DELAI_APRES_NAV = 300;
const INTERVALLE_SUIVI = 200;
const TENTATIVES_MAX = 20; // ~4s à 200ms avant d'abandonner et de sauter l'étape

@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.component.html',
  styleUrls: ['./tutorial-overlay.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslatePipe],
})
export class TutorialOverlayComponent implements OnDestroy {

  rect: DOMRect | null = null;

  private minuteur?: ReturnType<typeof setInterval>;
  private tentatives = 0;
  private elCible: HTMLElement | null = null;

  constructor(readonly tutorialService: TutorialService, private router: Router) {
    effect(() => {
      const e = this.tutorialService.etapeCourante();
      if (!e) {
        this.arreterSuivi();
        return;
      }
      this.gererEtape(e);
    });
  }

  ngOnDestroy() {
    this.arreterSuivi();
  }

  suivant() { this.tutorialService.suivant(); }
  passer()  { this.tutorialService.passer(); }

  private readonly marge = 14;
  private readonly largeurEstimee = 320;
  private readonly hauteurEstimee = 190;

  /**
   * Position de la bulle par rapport à la cible, calculée une fois et
   * partagée entre `positionBulle()` et `pointeStyle()` pour qu'elles restent
   * cohérentes entre elles (même bulle, même pointe).
   */
  private calculerPosition(): { top: number; centreX: number; enBas: boolean } | null {
    const r = this.rect;
    if (!r) return null;
    const { marge, largeurEstimee, hauteurEstimee } = this;
    const centreX = Math.min(
      Math.max(r.left + r.width / 2, largeurEstimee / 2 + marge),
      window.innerWidth - largeurEstimee / 2 - marge,
    );

    let top: number;
    let enBas: boolean; // true = bulle sous la cible (pointe vers le haut) ; false = au dessus (pointe vers le bas)
    if (r.bottom + marge + hauteurEstimee <= window.innerHeight) {
      top = r.bottom + marge; // assez de place en dessous de la cible
      enBas = true;
    } else if (r.top - marge - hauteurEstimee >= 0) {
      top = r.top - marge - hauteurEstimee; // assez de place au dessus
      enBas = false;
    } else {
      top = window.innerHeight - hauteurEstimee - marge; // cible plein écran : ni haut ni bas dispo
      enBas = false;
    }
    // Filet de sécurité : garantit que la bulle reste toujours visible à l'écran.
    top = Math.max(marge, Math.min(top, window.innerHeight - hauteurEstimee - marge));

    return { top, centreX, enBas };
  }

  positionBulle(): Record<string, string> {
    const pos = this.calculerPosition();
    if (!pos) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    return { position: 'fixed', top: `${pos.top}px`, left: `${pos.centreX}px`, transform: 'translateX(-50%)' };
  }

  /** Pas de pointe quand la bulle est centrée (pas de cible précise à désigner). */
  pointeVisible(): boolean {
    return !!this.rect;
  }

  pointeClasse(): string {
    const pos = this.calculerPosition();
    return pos?.enBas ? 'tuto-pointe--haut' : 'tuto-pointe--bas';
  }

  /** Décalage horizontal de la pointe dans la bulle, alignée sur le centre de la cible. */
  pointeStyle(): Record<string, string> {
    const r = this.rect;
    const pos = this.calculerPosition();
    if (!r || !pos) return {};
    const margeCoin = 20; // distance mini aux coins arrondis de la bulle
    const cibleX = r.left + r.width / 2;
    const decalage = Math.min(
      Math.max(cibleX - (pos.centreX - this.largeurEstimee / 2), margeCoin),
      this.largeurEstimee - margeCoin,
    );
    return { left: `${decalage}px` };
  }

  private gererEtape(e: EtapeTuto) {
    const route = this.tutorialService.resoudreRoute(e);

    if (route === null) {
      // Données pas encore chargées (ex: zones() vide) : on ne peut pas
      // résoudre la page cible, on saute l'étape plutôt que de bloquer.
      setTimeout(() => this.tutorialService.suivant());
      return;
    }

    if (route !== undefined && this.router.url !== route) {
      this.router.navigateByUrl(route);
      setTimeout(() => this.demarrerSuivi(e), DELAI_APRES_NAV);
    } else {
      this.demarrerSuivi(e);
    }
  }

  private demarrerSuivi(e: EtapeTuto) {
    this.arreterSuivi();

    if (!e.cible) {
      this.rect = null;
      return;
    }

    this.tentatives = 0;
    this.minuteur = setInterval(() => {
      const el = document.querySelector<HTMLElement>(`[data-tuto="${e.cible}"]`);
      if (el) {
        if (el !== this.elCible) {
          this.elCible = el;
          this.amenerDansLaVue(el);
        }
        this.rect = el.getBoundingClientRect();
        return;
      }
      this.tentatives++;
      if (this.tentatives >= TENTATIVES_MAX) {
        this.arreterSuivi();
        this.tutorialService.suivant();
      }
    }, INTERVALLE_SUIVI);
  }

  /** Scrolle la cible dans le champ visible si une partie (ex: bas de fiche point) dépasse. */
  private amenerDansLaVue(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const visible = r.top >= 0 && r.bottom <= window.innerHeight;
    if (!visible) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  private arreterSuivi() {
    if (this.minuteur) {
      clearInterval(this.minuteur);
      this.minuteur = undefined;
    }
    this.elCible = null;
    this.rect = null;
  }
}
