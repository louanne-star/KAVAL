import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

const RAYON_DEBLOCAGE  = 50;
const CLE_PERSISTANCE  = 'kaval_journey_v1';
const DEV_TOUT_DEBLOQUE = false; // ← passer à true pour tester sans se déplacer
const OSRM_BASE        = 'https://router.project-osrm.org/route/v1/foot';
const DIRECTION_NOMS   = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
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

  // Real road geometries for the 4 segments connecting the 5 zones.
  // Populated asynchronously after route construction; map falls back
  // to straight lines until this resolves.
  segmentsItineraire  = signal<SegmentItineraire[]>([]);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly zonesDebloquees = computed(() =>
    this.zones().filter(z => z.debloque).length
  );

  readonly prochaineZone = computed(() =>
    this.zones().find(z => !z.debloque) ?? null
  );

  readonly parcoursTermine = computed(() =>
    this.zones().length === 5 && this.zones().every(z => z.debloque)
  );

  readonly indicationDirection = computed((): {
    distance: number; direction: string; fleche: string;
  } | null => {
    const pos       = this.positionUtilisateur();
    const prochaine = this.prochaineZone();
    if (!pos || !prochaine) return null;

    const dist      = this.haversine(pos.coords.latitude, pos.coords.longitude, prochaine.coords[0], prochaine.coords[1]);
    const bearing   = this.calculerBearing(pos.coords.latitude, pos.coords.longitude, prochaine.coords[0], prochaine.coords[1]);
    const direction = DIRECTION_NOMS[Math.round(bearing / 45) % 8];
    return { distance: Math.round(dist), direction, fleche: DIRECTION_FLECHES[direction] ?? '→' };
  });

  readonly devMode = DEV_TOUT_DEBLOQUE;

  // watchPosition handle — kept as a number to pass to clearWatch on dispose
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

  // Exposed so the map page can compute user ↔ zone distances for display
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

    const save: { ordre: string[]; debloque: string[] } = JSON.parse(value);
    const zones = save.ordre
      .map((id, i) => {
        const src = ZONES_SOURCE.find(z => z.id === id);
        if (!src) return null;
        return { ...src, ordre: i + 1, debloque: save.debloque.includes(id) } as JourneyZone;
      })
      .filter((z): z is JourneyZone => z !== null);

    if (zones.length === 5) {
      if (DEV_TOUT_DEBLOQUE) zones.forEach(z => z.debloque = true);
      this.zones.set(zones);
      this.fetcherItineraires(zones); // Restore real road geometries in background
    }
  }

  private async sauvegarderEtat() {
    const zones = this.zones();
    await Preferences.set({
      key: CLE_PERSISTANCE,
      value: JSON.stringify({
        ordre:    zones.map(z => z.id),
        debloque: zones.filter(z => z.debloque).map(z => z.id)
      })
    });
  }

  // ── GPS ────────────────────────────────────────────────────────────────────

  private demarrerGPS() {
    if (!navigator.geolocation) {
      this.erreurGPS.set("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    // maximumAge: 5000 — accept a cached position up to 5 s old, matching the
    // desired update interval without hammering the GPS radio
    this.gpsWatchId = navigator.geolocation.watchPosition(
      pos => this.surPositionObtenue(pos),
      err => this.erreurGPS.set(this.messageErreurGPS(err)),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  private async surPositionObtenue(position: GeolocationPosition) {
    this.positionUtilisateur.set(position);
    this.erreurGPS.set(null);
    if (this.zones().length === 0) {
      this.construireRoute(position);
    } else {
      await this.verifierDeblocage(position);
    }
  }

  // ── Route construction (nearest-neighbor TSP) ──────────────────────────────

  private construireRoute(position: GeolocationPosition) {
    const { latitude: lat, longitude: lng } = position.coords;
    const ordered = this.voisinLePlusProche(lat, lng, [...ZONES_SOURCE]);

    const zones: JourneyZone[] = ordered.map((src, i) => ({
      ...src, ordre: i + 1, debloque: false
    }));

    if (DEV_TOUT_DEBLOQUE) {
      zones.forEach(z => z.debloque = true);
    } else {
      zones[0].debloque = true; // Zone 1 always unlocked

      // Edge case: user starts near a later zone — unlock all zones up to that point
      for (let i = 1; i < zones.length; i++) {
        if (this.haversine(lat, lng, zones[i].coords[0], zones[i].coords[1]) <= RAYON_DEBLOCAGE) {
          zones[i].debloque = true;
        } else {
          break;
        }
      }
    }

    this.zones.set(zones);
    this.sauvegarderEtat();
    this.fetcherItineraires(zones); // Kick off OSRM routing in background
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
  //
  // Requests 4 walking-profile routes in parallel (one per consecutive pair).
  // Each response replaces the straight-line fallback already drawn on the map.
  // OSRM uses [lng, lat] order; we convert to [lat, lng] for Leaflet.

  private fetcherItineraires(zones: JourneyZone[]) {
    const promises = zones.slice(0, -1).map((a, i) =>
      this.fetcherSegment(a, zones[i + 1])
    );
    Promise.all(promises).then(segments => this.segmentsItineraire.set(segments));
  }

  private async fetcherSegment(a: JourneyZone, b: JourneyZone): Promise<SegmentItineraire> {
    // Fallback used when OSRM is unreachable or the island has no road data
    const fallback: SegmentItineraire = {
      coordonnees: [a.coords, b.coords],
      distance: 0,
      duree: 0
    };
    try {
      // OSRM expects coordinates as lng,lat
      const waypoints = `${a.coords[1]},${a.coords[0]};${b.coords[1]},${b.coords[0]}`;
      const resp = await fetch(
        `${OSRM_BASE}/${waypoints}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!resp.ok) return fallback;

      const data = await resp.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return fallback;

      const route = data.routes[0];
      // Convert OSRM [lng, lat] → Leaflet [lat, lng]
      const coordonnees = (route.geometry.coordinates as [number, number][])
        .map(([lng, lat]) => [lat, lng] as [number, number]);

      return { coordonnees, distance: route.distance, duree: route.duration };
    } catch {
      return fallback;
    }
  }

  // ── Geofencing ─────────────────────────────────────────────────────────────

  private async verifierDeblocage(position: GeolocationPosition) {
    if (DEV_TOUT_DEBLOQUE) return;

    const { latitude: lat, longitude: lng } = position.coords;
    const zones   = [...this.zones()];
    let modifie   = false;

    for (let i = 0; i < zones.length; i++) {
      if (zones[i].debloque) continue;
      if (i > 0 && !zones[i - 1].debloque) break;
      if (this.haversine(lat, lng, zones[i].coords[0], zones[i].coords[1]) <= RAYON_DEBLOCAGE) {
        zones[i].debloque = true;
        modifie = true;
        this.declencherFeedback();
      }
      break;
    }

    if (modifie) {
      this.zones.set(zones);
      await this.sauvegarderEtat();
    }
  }

  private async declencherFeedback() {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch { /* browser */ }
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
