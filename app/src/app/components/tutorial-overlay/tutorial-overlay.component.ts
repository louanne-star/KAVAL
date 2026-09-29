import { Component, ElementRef, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TutorialService, EtapeTuto } from '../../services/tutorial.service';

// Délai avant de chercher la cible après une navigation : laisse le temps au
// routeur/à Angular de rendre la nouvelle page avant qu'on interroge le DOM.
const DELAI_APRES_NAV = 300;
const INTERVALLE_SUIVI = 200;
const TENTATIVES_MAX = 20; // ~4s à 200ms avant d'abandonner et de sauter l'étape
// Durée du scroll fluide vers une cible hors champ : le temps qu'il tienne,
// on gèle la position (voile plein, pas de pointe) plutôt que de la faire
// suivre l'écran en plein défilement, ce qui donnait une pointe erratique.
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
  // Rayon de bordure réel de l'élément ciblé (ex: cercle pour un bouton rond,
  // coins arrondis pour une carte), repris tel quel sur la découpe pour
  // qu'elle épouse sa forme — sinon la découpe (toujours rectangulaire côté
  // calcul) laisse voir des coins carrés non assombris autour d'une cible ronde.
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
      // Après le rendu du nouveau texte (titre/texte peuvent changer de
      // longueur d'une étape à l'autre) : remesure la bulle réelle plutôt que
      // de deviner sa taille, pour que la pointe reste toujours bien alignée.
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
  // Dégagement plus large que `marge` côté bas d'écran, pour ne jamais
  // recouvrir la barre de navigation custom en fixed (~80px de haut).
  private readonly margeBasEcran = 96;
  private readonly padSpot = 10;
  // Valeurs de secours tant que la bulle n'a pas encore été mesurée une
  // première fois (voir remesurerBulle) — remplacées par ses dimensions
  // réelles ensuite, texte et langue variant sa hauteur d'une étape à l'autre.
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

  /**
   * Position de la bulle par rapport à la cible, calculée une fois et
   * partagée entre `positionBulle()` et `pointeStyle()` pour qu'elles restent
   * cohérentes entre elles (même bulle, même pointe).
   */
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
      // Cible occupant (quasi) tout l'écran (ex: la carte entière) : aucune
      // direction n'a de sens, pointer vers le haut ou le bas serait trompeur.
      top = window.innerHeight - hauteurEstimee - this.margeBasEcran;
      enBas = false;
      pointeOk = false;
    }
    // Filet de sécurité : garantit que la bulle reste toujours visible à l'écran,
    // sans jamais recouvrir la barre de navigation en bas.
    top = Math.max(marge, Math.min(top, window.innerHeight - hauteurEstimee - this.margeBasEcran));

    return { top, centreX, enBas, pointeOk };
  }

  /** Découpe lumineuse autour de la cible — voir rayonCible pour la forme. */
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

  /**
   * Pas de pointe quand la bulle est centrée (pas de cible précise à
   * désigner), ni quand la cible occupe (quasi) tout l'écran : pointer vers
   * le haut ou le bas n'aurait alors aucun sens (ex: la carte entière).
   */
  pointeVisible(): boolean {
    return !!this.calculerPosition()?.pointeOk;
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
      Math.max(cibleX - (pos.centreX - this.largeurBulle / 2), margeCoin),
      this.largeurBulle - margeCoin,
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
      // On change de page : la cible actuelle (si il y en a une) va disparaître
      // du DOM, donc on efface tout de suite plutôt que de laisser le
      // surlignage fantôme de l'ancienne page affiché par-dessus la nouvelle
      // pendant les 300ms d'attente.
      this.arreterMinuteur();
      this.elCible = null;
      this.rect = null;
      this.router.navigateByUrl(route);
      setTimeout(() => this.demarrerSuivi(e), DELAI_APRES_NAV);
    } else {
      this.demarrerSuivi(e);
    }
  }

  /**
   * Ne coupe que la surveillance en cours (minuteur, gel de scroll) sans
   * remettre `rect`/`elCible` à zéro : quand la prochaine cible est déjà
   * visible sur la même page, `rect` passe directement de l'ancienne valeur
   * à la nouvelle en une fois, et les transitions CSS animent un glissement
   * fluide plutôt qu'un flash au centre suivi d'un saut — c'est ce qui
   * donnait des à-coups à chaque bulle.
   */
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
          return; // le rect est fixé par amenerDansLaVue, une fois la cible stable
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

    chercher(); // vérification immédiate : pas d'attente du premier tick (200ms) de l'intervalle
    this.minuteur = setInterval(chercher, INTERVALLE_SUIVI);
  }

  /**
   * Scrolle la cible dans le champ visible si une partie (ex: bas de fiche
   * point) dépasse. Pendant le défilement, on gèle l'affichage (voile plein,
   * pas de pointe) plutôt que de faire suivre la pointe à une position
   * intermédiaire qui n'a plus rien à voir avec la cible finale — c'est ce
   * qui donnait l'impression que certaines bulles pointaient au mauvais
   * endroit.
   */
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

  /** Coupure complète (fin du tuto, destruction du composant, cible introuvable). */
  private arreterSuivi() {
    this.arreterMinuteur();
    this.elCible = null;
    this.rect = null;
  }
}
