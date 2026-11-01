// Overlay du tuto guidé : voile sombre avec une découpe lumineuse sur
// l'élément ciblé et une bulle de texte qui pointe dessus.
import { Component, ElementRef, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TutorialService, EtapeTuto } from '../../services/tutorial.service';

// Laisse le temps à Angular de rendre la nouvelle page avant de chercher la cible.
const DELAI_APRES_NAV = 300;
const INTERVALLE_SUIVI = 200;
const TENTATIVES_MAX = 20; // ~4s avant d'abandonner et de sauter l'étape
const DUREE_SCROLL = 450;

@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.component.html',
  styleUrls: ['./tutorial-overlay.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslatePipe],
})
export class TutorialOverlayComponent implements OnDestroy {

  rect: DOMRect | null = null;
  // Rayon de bordure de la cible, repris sur la découpe pour qu'elle épouse
  // sa forme (sinon coins carrés non assombris autour d'un bouton rond).
  private rayonCible = '16px';

  @ViewChild('bulleEl') private bulleEl?: ElementRef<HTMLElement>;

  private minuteur?: ReturnType<typeof setInterval>;
  private tentatives = 0;
  private elCible: HTMLElement | null = null;
  private geleDurantScroll = false;
  private scrollTimeout?: ReturnType<typeof setTimeout>;
  private mesureTimeout?: ReturnType<typeof setTimeout>;

  constructor(readonly tutorialService: TutorialService, private router: Router) {
    effect(() => {
      const e = this.tutorialService.etapeCourante();
      if (!e) {
        this.arreterSuivi();
        return;
      }
      this.gererEtape(e);
      // Le texte change de longueur d'une étape à l'autre, donc on remesure
      // la bulle réelle plutôt que de deviner sa taille.
      clearTimeout(this.mesureTimeout);
      this.mesureTimeout = setTimeout(() => this.remesurerBulle());
    });
  }

  ngOnDestroy() {
    this.arreterSuivi();
    clearTimeout(this.mesureTimeout);
  }

  suivant() { this.tutorialService.suivant(); }
  passer()  { this.tutorialService.passer(); }

  private readonly marge = 14;
  // Marge plus large en bas, pour ne pas recouvrir la barre de navigation.
  private readonly margeBasEcran = 96;
  private readonly padSpot = 10;
  // Valeurs de secours avant la 1ère mesure réelle (voir remesurerBulle).
  private largeurBulle = 320;
  private hauteurBulle = 190;

  private remesurerBulle() {
    const el = this.bulleEl?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      this.largeurBulle = r.width;
      this.hauteurBulle = r.height;
    }
  }

  // Position de la bulle, partagée entre positionBulle() et pointeStyle()
  // pour qu'elles restent cohérentes.
  private calculerPosition(): { top: number; centreX: number; enBas: boolean; pointeOk: boolean } | null {
    const r = this.rect;
    if (!r) return null;
    const { marge, largeurBulle: largeurEstimee, hauteurBulle: hauteurEstimee } = this;
    const centreX = Math.min(
      Math.max(r.left + r.width / 2, largeurEstimee / 2 + marge),
      window.innerWidth - largeurEstimee / 2 - marge,
    );

    let top: number;
    let enBas: boolean; // true = bulle sous la cible (pointe vers le haut) ; false = au dessus (pointe vers le bas)
    let pointeOk = true;
    if (r.bottom + marge + hauteurEstimee <= window.innerHeight) {
      top = r.bottom + marge; // assez de place en dessous de la cible
      enBas = true;
    } else if (r.top - marge - hauteurEstimee >= 0) {
      top = r.top - marge - hauteurEstimee; // assez de place au dessus
      enBas = false;
    } else {
      // Cible qui occupe tout l'écran (ex: la carte) : pas de direction sensée.
      top = window.innerHeight - hauteurEstimee - this.margeBasEcran;
      enBas = false;
      pointeOk = false;
    }
    // Filet de sécurité : reste toujours visible, pas sous la barre de nav.
    top = Math.max(marge, Math.min(top, window.innerHeight - hauteurEstimee - this.margeBasEcran));

    return { top, centreX, enBas, pointeOk };
  }

  // Découpe lumineuse autour de la cible, voir rayonCible pour la forme.
  spotStyle(): Record<string, string> {
    const r = this.rect;
    if (!r) return {};
    const { padSpot } = this;
    return {
      top: `${r.top - padSpot}px`,
      left: `${r.left - padSpot}px`,
      width: `${r.width + padSpot * 2}px`,
      height: `${r.height + padSpot * 2}px`,
      'border-radius': this.rayonCible,
    };
  }

  positionBulle(): Record<string, string> {
    const pos = this.calculerPosition();
    if (!pos) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    return { position: 'fixed', top: `${pos.top}px`, left: `${pos.centreX}px`, transform: 'translateX(-50%)' };
  }

  // Pas de pointe si la bulle est centrée ou si la cible occupe tout l'écran.
  pointeVisible(): boolean {
    return !!this.calculerPosition()?.pointeOk;
  }

  pointeClasse(): string {
    const pos = this.calculerPosition();
    return pos?.enBas ? 'tuto-pointe--haut' : 'tuto-pointe--bas';
  }

  // Décalage horizontal de la pointe, alignée sur le centre de la cible.
  pointeStyle(): Record<string, string> {
    const r = this.rect;
    const pos = this.calculerPosition();
    if (!r || !pos) return {};
    const margeCoin = 20; // distance mini aux coins arrondis de la bulle
    const cibleX = r.left + r.width / 2;
    const decalage = Math.min(
      Math.max(cibleX - (pos.centreX - this.largeurBulle / 2), margeCoin),
      this.largeurBulle - margeCoin,
    );
    return { left: `${decalage}px` };
  }

  private gererEtape(e: EtapeTuto) {
    const route = this.tutorialService.resoudreRoute(e);

    if (route === null) {
      // Données pas encore chargées : on saute l'étape plutôt que de bloquer.
      setTimeout(() => this.tutorialService.suivant());
      return;
    }

    if (route !== undefined && this.router.url !== route) {
      // On change de page, donc on efface tout de suite la cible actuelle
      // plutôt que de laisser son surlignage fantôme pendant l'attente.
      this.arreterMinuteur();
      this.elCible = null;
      this.rect = null;
      this.router.navigateByUrl(route);
      setTimeout(() => this.demarrerSuivi(e), DELAI_APRES_NAV);
    } else {
      this.demarrerSuivi(e);
    }
  }

  // Coupe juste la surveillance en cours, sans remettre rect/elCible à zéro.
  // Si la prochaine cible est déjà visible, rect passe directement de
  // l'ancienne valeur à la nouvelle et les transitions CSS glissent, au
  // lieu d'un flash au centre suivi d'un saut.
  private arreterMinuteur() {
    if (this.minuteur) {
      clearInterval(this.minuteur);
      this.minuteur = undefined;
    }
    clearTimeout(this.scrollTimeout);
    this.geleDurantScroll = false;
  }

  private demarrerSuivi(e: EtapeTuto) {
    this.arreterMinuteur();

    if (!e.cible) {
      this.elCible = null;
      this.rect = null;
      return;
    }

    this.tentatives = 0;
    const chercher = () => {
      const el = document.querySelector<HTMLElement>(`[data-tuto="${e.cible}"]`);
      if (el) {
        if (el !== this.elCible) {
          this.elCible = el;
          this.rayonCible = getComputedStyle(el).borderRadius || '16px';
          this.amenerDansLaVue(el);
          return; // rect fixé par amenerDansLaVue une fois la cible stable
        }
        if (!this.geleDurantScroll) {
          this.rect = el.getBoundingClientRect();
        }
        return;
      }
      this.tentatives++;
      if (this.tentatives >= TENTATIVES_MAX) {
        this.arreterSuivi();
        this.tutorialService.suivant();
      }
    };

    chercher(); // vérification immédiate, pas d'attente du 1er tick
    this.minuteur = setInterval(chercher, INTERVALLE_SUIVI);
  }

  // Scrolle la cible dans le champ visible si besoin. Pendant le scroll, on
  // gèle l'affichage plutôt que de faire suivre la pointe en plein
  // défilement (ça donnait l'impression qu'elle pointait au mauvais endroit).
  private amenerDansLaVue(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const visible = r.top >= 0 && r.bottom <= window.innerHeight;
    if (visible) {
      this.rect = r;
      return;
    }
    this.geleDurantScroll = true;
    this.rect = null;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.geleDurantScroll = false;
      this.rect = el.getBoundingClientRect();
    }, DUREE_SCROLL);
  }

  // Coupure complète : fin du tuto, destruction du composant, cible introuvable.
  private arreterSuivi() {
    this.arreterMinuteur();
    this.elCible = null;
    this.rect = null;
  }
}
