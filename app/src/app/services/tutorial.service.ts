import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '../core/preferences';
import { JourneyService } from './journey.service';

export interface EtapeTuto {
  id: string;
  // Valeur de l'attribut data-tuto de l'élément réel à mettre en surbrillance.
  // Absent = bulle centrée, sans cible (ex: écrans de bienvenue/fin).
  cible?: string;
  // Route à rejoindre avant de chercher la cible. `SENTINELLE_POINT_CAMP_EST`
  // est résolue dynamiquement (voir resoudreRoute) car l'id du point dépend
  // des données chargées, pas connu statiquement.
  route?: string;
  titreKey: string;
  texteKey: string;
}

const CLE_ETAPE   = 'kaval_tuto_etape';
const CLE_TERMINE = 'kaval_tuto_termine';

const SENTINELLE_POINT_CAMP_EST = 'point-camp-est';

const etape = (id: string, cle: string, cible?: string, route?: string): EtapeTuto => ({
  id, cible, route,
  titreKey: `tuto.etapes.${cle}.titre`,
  texteKey: `tuto.etapes.${cle}.texte`,
});

// Zone utilisée pour les étapes "fiche point" (histoire/mini-jeu/témoignage/
// quiz) : Camp Est, la même que dans le PDF de référence, car c'est la seule
// garantie d'avoir les 4 sections en même temps (toutes les zones n'ont pas
// de mini-jeu).
export const ZONE_ID_DEMO = 'camp_est';

// Chaque fonctionnalité est traitée en une seule fois (icône sur la carte
// puis, dans la foulée, la page qu'elle ouvre) plutôt que d'être survolée au
// début et revisitée à la fin — plus logique à suivre pour l'utilisateur.
export const ETAPES_TUTO: EtapeTuto[] = [
  etape('bienvenue',            'bienvenue'),
  etape('carte-recentrer',      'carteRecentrer',      'carte-recentrer',   '/tabs/carte'),
  etape('carte-satellite',      'carteSatellite',      'carte-satellite'),
  etape('carte-points',         'cartePoints',         'carte-points'),
  etape('carte-recherche',      'carteRecherche',      'carte-recherche'),
  etape('recherche',            'recherche',           'recherche-chips',   '/recherche'),
  etape('carte-favoris',        'carteFavoris',        'carte-favoris',     '/tabs/carte'),
  etape('favoris',              'favoris',             'favoris-page',      '/favoris'),
  etape('point-histoire',       'pointHistoire',       'point-histoire',    SENTINELLE_POINT_CAMP_EST),
  etape('point-minijeu',        'pointMinijeu',        'point-minijeu'),
  etape('point-temoignage',     'pointTemoignage',     'point-temoignage'),
  etape('point-quiz',           'pointQuiz',           'point-quiz'),
  etape('parcours-tab',         'parcoursTab',         'tab-parcours',      '/tabs/parcours'),
  etape('parcours-progression', 'parcoursProgression', 'parcours-progression'),
  etape('apropos-tab',          'aproposTab',          'tab-apropos',       '/tabs/apropos'),
  etape('fin',                  'fin'),
];

@Injectable({ providedIn: 'root' })
export class TutorialService {

  readonly etapeIndex = signal(0);
  readonly actif      = signal(false);

  readonly total = ETAPES_TUTO.length;

  readonly etapeCourante = computed<EtapeTuto | null>(() =>
    this.actif() ? (ETAPES_TUTO[this.etapeIndex()] ?? null) : null
  );

  constructor(private journeyService: JourneyService) {}

  /** Lance le tuto depuis le début — appelé juste après une inscription réussie. */
  async demarrer() {
    this.etapeIndex.set(0);
    this.actif.set(true);
    await Preferences.set({ key: CLE_ETAPE, value: '0' });
  }

  /**
   * Reprend le tuto là où l'utilisateur l'a laissé, uniquement s'il a déjà
   * été démarré sur cet appareil et jamais terminé. N'affecte jamais un
   * compte qui ne l'a jamais commencé (utilisateurs déjà inscrits avant
   * l'introduction de cette fonctionnalité).
   */
  async reprendreSiEnCours() {
    if (this.actif()) return;
    const { value: termine } = await Preferences.get({ key: CLE_TERMINE });
    if (termine) return;
    const { value: etapeSauvee } = await Preferences.get({ key: CLE_ETAPE });
    if (etapeSauvee === null || etapeSauvee === undefined) return;
    const index = parseInt(etapeSauvee, 10);
    this.etapeIndex.set(Number.isFinite(index) ? index : 0);
    this.actif.set(true);
  }

  suivant() {
    const prochain = this.etapeIndex() + 1;
    if (prochain >= this.total) {
      this.terminer();
      return;
    }
    this.etapeIndex.set(prochain);
    Preferences.set({ key: CLE_ETAPE, value: String(prochain) });
  }

  /** Bouton "Passer" : masque le tuto pour cette session, sans le marquer terminé. */
  passer() {
    this.actif.set(false);
  }

  terminer() {
    this.actif.set(false);
    Preferences.set({ key: CLE_TERMINE, value: '1' });
  }

  /**
   * Résout la route à rejoindre pour une étape donnée.
   * - `undefined` : pas de navigation nécessaire, on reste sur la page actuelle.
   * - `string` : url à rejoindre.
   * - `null` : impossible à résoudre (données pas encore chargées) → l'appelant
   *   doit sauter l'étape.
   */
  resoudreRoute(e: EtapeTuto): string | null | undefined {
    if (!e.route) return undefined;
    if (e.route === SENTINELLE_POINT_CAMP_EST) {
      const zone = this.journeyService.zones().find(z => z.zoneId === ZONE_ID_DEMO);
      return zone ? `/tabs/parcours?zone=${zone.id}` : null;
    }
    return e.route;
  }
}
