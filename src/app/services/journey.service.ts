import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

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
}

export interface SegmentItineraire {
  coordonnees: [number, number][]; // [lat, lng] pairs, ready for Leaflet
  distance: number;                // metres from OSRM
  duree: number;                   // seconds from OSRM
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ZONES_SOURCE: Omit<JourneyZone, 'ordre' | 'debloque'>[] = [
  {
    id: 'camp_est',
    nom: 'Le Camp Est',
    description: 'Annexe du pénitencier avec activités industrielles et bâtiments cellulaires.',
    coords: [-22.2710, 166.4260],
    couleurZone: '#e74c3c',
    rayonZone: 180
  },
  {
    id: 'vacherie',
    nom: 'La Vacherie',
    description: 'Zone agricole regroupant le camp des libérés et le cimetière des surveillants.',
    coords: [-22.2669, 166.4130],
    couleurZone: '#9b59b6',
    rayonZone: 160
  },
  {
    id: 'hopital',
    nom: "L'Hôpital du Marais",
    description: 'Ancienne zone hospitalière avec chapelle, lavoir, briqueterie et cimetière.',
    coords: [-22.2667, 166.3975],
    couleurZone: '#3498db',
    rayonZone: 200
  },
  {
    id: 'penitencier',
    nom: 'Le Pénitencier',
    description: "Cœur historique de l'Île Nou. Musée du bagne et parcours archéologique.",
    coords: [-22.2617, 166.4033],
    couleurZone: '#27ae60',
    rayonZone: 220
  },
  {
    id: 'ferme_nord',
    nom: 'La Ferme Nord',
    description: "Zone dédiée à l'agriculture et à l'isolement sanitaire. Phare et léproserie.",
    coords: [-22.2606, 166.3909],
    couleurZone: '#f39c12',
    rayonZone: 170
  },
];

const CLE_PERSISTANCE = 'kaval_journey_v1';
const OSRM_BASE       = 'https://router.project-osrm.org/route/v1/foot';
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

  // ── Public API ─────────────────────────────────────────────────────────────

  async initialiser() {
    await this.chargerEtat();
    this.demarrerGPS();
  }

  async reinitialiser() {
    await Preferences.remove({ key: CLE_PERSISTANCE });
    this.zones.set([]);
    this.segmentsItineraire.set([]);
    const pos = this.positionUtilisateur();
    if (pos) this.construireRoute(pos);
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

  private async chargerEtat() {
    const { value } = await Preferences.get({ key: CLE_PERSISTANCE });
    if (!value) return;

    const save: { ordre: string[] } = JSON.parse(value);
    const zones = save.ordre
      .map((id, i) => {
        const src = ZONES_SOURCE.find(z => z.id === id);
        if (!src) return null;
        return { ...src, ordre: i + 1, debloque: true } as JourneyZone;
      })
      .filter((z): z is JourneyZone => z !== null);

    if (zones.length === 5) {
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
      this.erreurGPS.set("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    this.gpsWatchId = navigator.geolocation.watchPosition(
      pos => this.surPositionObtenue(pos),
      err => this.erreurGPS.set(this.messageErreurGPS(err)),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  private surPositionObtenue(position: GeolocationPosition) {
    this.positionUtilisateur.set(position);
    this.erreurGPS.set(null);
    if (this.zones().length === 0) {
      this.construireRoute(position);
    }
  }

  // ── Route construction (nearest-neighbor TSP) ─────────────────────────────

  private construireRoute(position: GeolocationPosition) {
    const { latitude: lat, longitude: lng } = position.coords;
    const ordered = this.voisinLePlusProche(lat, lng, [...ZONES_SOURCE]);

    const zones: JourneyZone[] = ordered.map((src, i) => ({
      ...src, ordre: i + 1, debloque: true
    }));

    this.zones.set(zones);
    this.sauvegarderEtat();
    this.fetcherItineraires(zones);
  }

  private voisinLePlusProche(
    startLat: number, startLng: number,
    sources: typeof ZONES_SOURCE
  ): typeof ZONES_SOURCE {
    const restants  = [...sources];
    const ordonnes: typeof ZONES_SOURCE = [];
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
