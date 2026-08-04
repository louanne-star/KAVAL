import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PointsService } from './points.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JourneyZone {
  id: string;
  ordre: number;
  nom: string;
  description: string;
  coords: [number, number];
  debloque: boolean;
  couleurZone: string;
  rayonZone: number;
  zoneId: string;   // id de la zone visuelle de regroupement (ex: 'camp_est')
  zoneNom: string;  // nom de cette zone visuelle (ex: 'Le Camp Est')
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
    this.afficherErreurGPS("Active ta position pour lancer la navigation guidée.");
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
  private sourcePoints(): Omit<JourneyZone, 'ordre' | 'debloque'>[] {
    const zonesMeta = new Map(this.pointsService.zones().map(z => [z.id, z]));
    return this.pointsService.pointsVrai().map(p => {
      const zone = zonesMeta.get(p.zoneId);
      return {
        id: p.id,
        nom: p.nom,
        description: p.description,
        coords: p.coords,
        couleurZone: zone?.couleur ?? '#999999',
        rayonZone: p.rayon,
        zoneId: p.zoneId,
        zoneNom: zone?.nom ?? '',
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
        return { ...src, ordre: i + 1, debloque: true } as JourneyZone;
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
      this.afficherErreurGPS("Géolocalisation non disponible sur cet appareil.");
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

  // Affiche le bandeau d'erreur GPS et l'efface automatiquement après 5 minutes
  // pour ne pas laisser un avertissement obsolète affiché indéfiniment.
  private afficherErreurGPS(message: string) {
    this.erreurGPS.set(message);
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

  // ── Route construction (nearest-neighbor TSP) ─────────────────────────────

  private construireRoute(lat: number, lng: number) {
    const source = this.sourcePoints();
    const ordered = this.voisinLePlusProche(lat, lng, source);

    const zones: JourneyZone[] = ordered.map((src, i) => ({
      ...src, ordre: i + 1, debloque: true
    }));

    this.zones.set(zones);
    this.sauvegarderEtat();
    this.fetcherItineraires(zones);
  }

  private voisinLePlusProche<T extends { coords: [number, number] }>(
    startLat: number, startLng: number,
    sources: T[]
  ): T[] {
    const restants  = [...sources];
    const ordonnes: T[] = [];
    let lat = startLat, lng = startLng;
    while (restants.length > 0) {
      let closest = 0, minDist = Infinity;
      restants.forEach((z, i) => {
        const d = this.haversine(lat, lng, z.coords[0], z.coords[1]);
        if (d < minDist) { minDist = d; closest = i; }
      });
      const zone = restants.splice(closest, 1)[0];
      ordonnes.push(zone);
      lat = zone.coords[0]; lng = zone.coords[1];
    }
    return ordonnes;
  }

  // ── OSRM real-road routing ─────────────────────────────────────────────────

  private fetcherItineraires(zones: JourneyZone[]) {
    const promises = zones.slice(0, -1).map((a, i) =>
      this.fetcherSegment(a, zones[i + 1])
    );
    Promise.all(promises).then(segments => this.segmentsItineraire.set(segments));
  }

  private async fetcherSegment(a: JourneyZone, b: JourneyZone): Promise<SegmentItineraire> {
    const fallback: SegmentItineraire = { coordonnees: [a.coords, b.coords], distance: 0, duree: 0 };
    try {
      const waypoints = `${a.coords[1]},${a.coords[0]};${b.coords[1]},${b.coords[0]}`;
      const resp = await fetch(
        `${OSRM_BASE}/${waypoints}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!resp.ok) return fallback;
      const data = await resp.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return fallback;
      const coordonnees = (data.routes[0].geometry.coordinates as [number, number][])
        .map(([lng, lat]) => [lat, lng] as [number, number]);
      return { coordonnees, distance: data.routes[0].distance, duree: data.routes[0].duration };
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
    const msgs: Record<number, string> = {
      1: "Accès à la localisation refusé. Activez-la dans les réglages.",
      2: "Position indisponible. Vérifiez votre GPS.",
      3: "Délai d'attente GPS dépassé."
    };
    return msgs[err.code] ?? "Erreur GPS inconnue.";
  }
}
