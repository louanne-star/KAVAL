import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PointsService } from './points.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JourneyZone {
  id: string;
  ordre: number;
  nom: string;
  nomEn?: string;
  description: string;
  descriptionEn?: string;
  coords: [number, number];
  debloque: boolean;
  couleurZone: string;
  rayonZone: number;
  zoneId: string;   // id de la zone visuelle de regroupement (ex: 'camp_est')
  zoneNom: string;  // nom de cette zone visuelle (ex: 'Le Camp Est')
  zoneNomEn?: string;
}

export interface SegmentItineraire {
  coordonnees: [number, number][]; // [lat, lng] pairs, ready for Leaflet
  distance: number;                // metres from OSRM
  duree: number;                   // seconds from OSRM
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLE_PERSISTANCE = 'kaval_journey_v1';
const OSRM_BASE       = 'https://router.project-osrm.org/route/v1/foot';
// Position de secours utilisée quand le GPS échoue/est refusé : IUT de Nouvelle-Calédonie, Nouville.
const POSITION_DEPART_IUT: [number, number] = [-22.26889, 166.41944];
const DIRECTION_NOMS  = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const DIRECTION_FLECHES: Record<string, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SO: '↙', O: '←', NO: '↖'
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class JourneyService {

  // ── Signals ────────────────────────────────────────────────────────────────
  zones               = signal<JourneyZone[]>([]);
  positionUtilisateur = signal<GeolocationPosition | null>(null);
  erreurGPS           = signal<string | null>(null);
  segmentsItineraire  = signal<SegmentItineraire[]>([]);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly zonesDebloquees = computed(() =>
    this.zones().filter(z => z.debloque).length
  );

  private gpsWatchId = -1;
  private erreurGPSTimeout?: ReturnType<typeof setTimeout>;

  constructor(private pointsService: PointsService) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  async initialiser() {
    await this.pointsService.charger();
    await this.chargerEtat();
    this.demarrerGPS();
  }

  metaDe(zoneId: string) {
    return this.pointsService.metaDe(zoneId);
  }

  /** Affiche un avertissement quand une action nécessite une position réelle indisponible. */
  signalerPositionRequise() {
    this.afficherErreurGPS('carte.gps.positionRequise');
  }

  async reinitialiser() {
    await Preferences.remove({ key: CLE_PERSISTANCE });
    this.zones.set([]);
    this.segmentsItineraire.set([]);
    const pos = this.positionUtilisateur();
    if (pos) this.construireRoute(pos.coords.latitude, pos.coords.longitude);
    else this.demarrerAvecPositionDefaut();
  }

  dispose() {
    if (this.gpsWatchId !== -1) navigator.geolocation.clearWatch(this.gpsWatchId);
  }

  getFlecheVers(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const bearing   = this.calculerBearing(lat1, lng1, lat2, lng2);
    const direction = DIRECTION_NOMS[Math.round(bearing / 45) % 8];
    return DIRECTION_FLECHES[direction] ?? '→';
  }

  haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R  = 6371000;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  // Reconstruit la liste des vrai points depuis Supabase/cache (chargé au préalable via PointsService).
  // ordreCurateur = ordre éditorial (colonne points.ordre) : utilisé pour trier les points À
  // L'INTÉRIEUR d'une même zone (voir regrouperParZone) — distinct de JourneyZone.ordre, qui est
  // la position finale dans le tour une fois les zones elles-mêmes réordonnées.
  private sourcePoints(): (Omit<JourneyZone, 'ordre' | 'debloque'> & { ordreCurateur: number })[] {
    const zonesMeta = new Map(this.pointsService.zones().map(z => [z.id, z]));
    return this.pointsService.pointsVrai().map(p => {
      const zone = zonesMeta.get(p.zoneId);
      return {
        id: p.id,
        nom: p.nom,
        nomEn: p.nomEn,
        description: p.description,
        descriptionEn: p.descriptionEn,
        coords: p.coords,
        couleurZone: zone?.couleur ?? '#999999',
        rayonZone: p.rayon,
        zoneId: p.zoneId,
        zoneNom: zone?.nom ?? '',
        zoneNomEn: zone?.nomEn,
        ordreCurateur: p.ordre ?? Number.MAX_SAFE_INTEGER,
      };
    });
  }

  private async chargerEtat() {
    const source = this.sourcePoints();
    const { value } = await Preferences.get({ key: CLE_PERSISTANCE });
    if (!value) return;

    const save: { ordre: string[] } = JSON.parse(value);
    const zones = save.ordre
      .map((id, i) => {
        const src = source.find(z => z.id === id);
        if (!src) return null;
        const { ordreCurateur, ...rest } = src;
        return { ...rest, ordre: i + 1, debloque: true } as JourneyZone;
      })
      .filter((z): z is JourneyZone => z !== null);

    if (zones.length === source.length && zones.length > 0) {
      this.zones.set(zones);
      this.sauvegarderEtat(); // écrase l'ancien format (qui avait des zones verrouillées)
      this.fetcherItineraires(zones);
    }
  }

  private async sauvegarderEtat() {
    const zones = this.zones();
    await Preferences.set({
      key: CLE_PERSISTANCE,
      value: JSON.stringify({ ordre: zones.map(z => z.id) })
    });
  }

  // ── GPS ────────────────────────────────────────────────────────────────────

  private demarrerGPS() {
    if (!navigator.geolocation) {
      this.afficherErreurGPS('carte.gps.nonDisponible');
      this.demarrerAvecPositionDefaut();
      return;
    }

    // Filet de sécurité : sur certains appareils, watchPosition ne rappelle
    // jamais (ni succès ni erreur) quand le GPS n'arrive pas à capter de
    // signal — le "timeout" de l'API n'est alors pas fiable. On force donc
    // le repli sur l'IUT si rien n'est arrivé après 10s.
    const delaiSecours = setTimeout(() => this.demarrerAvecPositionDefaut(), 10000);

    this.gpsWatchId = navigator.geolocation.watchPosition(
      pos => {
        clearTimeout(delaiSecours);
        this.surPositionObtenue(pos);
      },
      err => {
        clearTimeout(delaiSecours);
        this.afficherErreurGPS(this.messageErreurGPS(err));
        this.demarrerAvecPositionDefaut();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  // Affiche le bandeau d'erreur GPS (une clé de traduction, résolue dans le
  // template — voir carte.gps.* dans translations.ts) et l'efface
  // automatiquement après 5 minutes pour ne pas laisser un avertissement
  // obsolète affiché indéfiniment.
  private afficherErreurGPS(cleTraduction: string) {
    this.erreurGPS.set(cleTraduction);
    clearTimeout(this.erreurGPSTimeout);
    this.erreurGPSTimeout = setTimeout(() => this.erreurGPS.set(null), 5 * 60 * 1000);
  }

  private surPositionObtenue(position: GeolocationPosition) {
    this.positionUtilisateur.set(position);
    this.erreurGPS.set(null);
    clearTimeout(this.erreurGPSTimeout);
    if (this.zones().length === 0) {
      this.construireRoute(position.coords.latitude, position.coords.longitude);
    }
  }

  // Utilise la position de l'IUT pour construire le parcours quand le GPS n'a jamais répondu.
  private demarrerAvecPositionDefaut() {
    if (this.zones().length > 0) return;
    const [lat, lng] = POSITION_DEPART_IUT;
    this.construireRoute(lat, lng);
  }

  // ── Route construction (ordre optimal des zones, points curatés par zone) ──
  //
  // L'ancien algorithme (plus-proche-voisin glouton point par point) pouvait
  // choisir une zone proche mais géographiquement excentrée (ex. camp_est, en
  // impasse au bout de la presqu'île) avant d'avoir fini les zones centrales,
  // forçant un aller-retour de plusieurs kilomètres. On ordonne maintenant les
  // ZONES de façon optimale (permutation exhaustive, réaliste vu leur petit
  // nombre), et à l'intérieur de chaque zone on respecte l'ordre curaté en
  // base (points.ordre) plutôt que de le recalculer.

  private construireRoute(lat: number, lng: number) {
    const source = this.sourcePoints();
    const groupes = this.regrouperParZone(source);
    const ordreZones = this.meilleurOrdreZones(lat, lng, groupes);

    const ordered = ordreZones.flatMap(zoneId => groupes.get(zoneId)!);
    const zones: JourneyZone[] = ordered.map((src, i) => {
      const { ordreCurateur, ...rest } = src;
      return { ...rest, ordre: i + 1, debloque: true };
    });

    this.zones.set(zones);
    this.sauvegarderEtat();
    this.fetcherItineraires(zones);
  }

  // Regroupe les points sources par zoneId, chaque groupe trié par ordre curaté
  // (repli sur l'id si ordre absent/dupliqué, pour ne jamais planter).
  private regrouperParZone<T extends { zoneId: string; ordreCurateur: number; id: string }>(
    sources: T[]
  ): Map<string, T[]> {
    const groupes = new Map<string, T[]>();
    for (const src of sources) {
      const groupe = groupes.get(src.zoneId);
      if (groupe) groupe.push(src);
      else groupes.set(src.zoneId, [src]);
    }
    groupes.forEach(groupe => groupe.sort((a, b) =>
      a.ordreCurateur - b.ordreCurateur || a.id.localeCompare(b.id)
    ));
    return groupes;
  }

  // Nombre max de zones pour lequel on teste toutes les permutations (8! = 40320,
  // négligeable) ; au-delà, repli sur un plus-proche-voisin au niveau zone pour
  // éviter une explosion factorielle.
  private readonly MAX_ZONES_PERMUTATION = 8;

  private meilleurOrdreZones<T extends { coords: [number, number] }>(
    startLat: number, startLng: number,
    groupes: Map<string, T[]>
  ): string[] {
    const zoneIds = [...groupes.keys()].sort();
    if (zoneIds.length <= 1) return zoneIds;

    if (zoneIds.length > this.MAX_ZONES_PERMUTATION) {
      return this.voisinLePlusProcheZones(startLat, startLng, zoneIds, groupes);
    }

    let meilleur = zoneIds;
    let meilleureDistance = Infinity;

    for (const permutation of this.permutations(zoneIds)) {
      let lat = startLat, lng = startLng, distance = 0;
      for (const zoneId of permutation) {
        const groupe = groupes.get(zoneId)!;
        const entree = groupe[0], sortie = groupe[groupe.length - 1];
        distance += this.haversine(lat, lng, entree.coords[0], entree.coords[1]);
        lat = sortie.coords[0]; lng = sortie.coords[1];
      }
      if (distance < meilleureDistance) {
        meilleureDistance = distance;
        meilleur = permutation;
      }
    }
    return meilleur;
  }

  // Repli pour un grand nombre de zones : plus-proche-voisin appliqué aux zones
  // (point d'entrée pour la distance, point de sortie pour avancer).
  private voisinLePlusProcheZones<T extends { coords: [number, number] }>(
    startLat: number, startLng: number,
    zoneIds: string[],
    groupes: Map<string, T[]>
  ): string[] {
    const restants = [...zoneIds];
    const ordonnes: string[] = [];
    let lat = startLat, lng = startLng;
    while (restants.length > 0) {
      let closest = 0, minDist = Infinity;
      restants.forEach((zoneId, i) => {
        const entree = groupes.get(zoneId)![0];
        const d = this.haversine(lat, lng, entree.coords[0], entree.coords[1]);
        if (d < minDist) { minDist = d; closest = i; }
      });
      const zoneId = restants.splice(closest, 1)[0];
      const sortie = groupes.get(zoneId)![groupes.get(zoneId)!.length - 1];
      ordonnes.push(zoneId);
      lat = sortie.coords[0]; lng = sortie.coords[1];
    }
    return ordonnes;
  }

  private permutations<T>(items: T[]): T[][] {
    if (items.length <= 1) return [items];
    const resultats: T[][] = [];
    items.forEach((item, i) => {
      const reste = [...items.slice(0, i), ...items.slice(i + 1)];
      for (const suite of this.permutations(reste)) {
        resultats.push([item, ...suite]);
      }
    });
    return resultats;
  }

  // ── OSRM real-road routing ─────────────────────────────────────────────────

  private fetcherItineraires(zones: JourneyZone[]) {
    const promises = zones.slice(0, -1).map((a, i) =>
      this.fetcherSegment(a, zones[i + 1])
    );
    Promise.all(promises).then(segments => this.segmentsItineraire.set(segments));
  }

  // Au-delà de ce ratio (distance OSRM / distance à vol d'oiseau), on considère que
  // le détour est absurde plutôt que réel — observé en pratique : dans le cluster
  // dense de la zone Pénitentiaire (bâtiments à 20-30m les uns des autres), OSRM
  // piéton fait parfois sortir jusqu'à la rue publique et revenir faute de chemin
  // direct cartographié, x3 à x6 la distance réelle. Ça donne un tracé en zigzag
  // qui semble "cassé" visuellement alors qu'il est techniquement continu — une
  // ligne droite est alors plus fidèle et plus lisible que ce faux détour.
  private readonly SEUIL_DETOUR_ABSURDE = 2.5;

  private async fetcherSegment(a: JourneyZone, b: JourneyZone): Promise<SegmentItineraire> {
    const distanceDirecte = this.haversine(a.coords[0], a.coords[1], b.coords[0], b.coords[1]);
    const fallback: SegmentItineraire = { coordonnees: [a.coords, b.coords], distance: distanceDirecte, duree: 0 };
    try {
      const waypoints = `${a.coords[1]},${a.coords[0]};${b.coords[1]},${b.coords[0]}`;
      const resp = await fetch(
        `${OSRM_BASE}/${waypoints}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!resp.ok) return fallback;
      const data = await resp.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return fallback;
      const distance = data.routes[0].distance;
      if (distanceDirecte > 15 && distance > distanceDirecte * this.SEUIL_DETOUR_ABSURDE) return fallback;
      const coordonnees = (data.routes[0].geometry.coordinates as [number, number][])
        .map(([lng, lat]) => [lat, lng] as [number, number]);
      return { coordonnees, distance, duree: data.routes[0].duration };
    } catch {
      return fallback;
    }
  }

  // ── Geometry helpers ───────────────────────────────────────────────────────

  private calculerBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y    = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x    = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                 Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }

  private messageErreurGPS(err: GeolocationPositionError): string {
    const cles: Record<number, string> = {
      1: 'carte.gps.refuse',
      2: 'carte.gps.indisponible',
      3: 'carte.gps.timeout',
    };
    return cles[err.code] ?? 'carte.gps.inconnue';
  }
}
