import { Component, AfterViewInit, OnDestroy, signal, computed, effect, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { JourneyService, JourneyZone, SegmentItineraire } from '../../services/journey.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MapPage implements AfterViewInit, OnDestroy {

  // ── Component state ───────────────────────────────────────────────────────

  private mapPret        = signal(false);
  zoneSelectionneeId     = signal<string | null>(null);

  // Derived from signal so the bottom sheet always reflects current unlock state
  zoneSelectionnee = computed(() => {
    const id = this.zoneSelectionneeId();
    return id ? (this.journeyService.zones().find(z => z.id === id) ?? null) : null;
  });

  // ── Leaflet handles ───────────────────────────────────────────────────────

  private map!: L.Map;
  private marqueurs              = new Map<string, L.Marker>();
  private overlays               = new Map<string, L.Circle>();
  private segments               = new Map<string, { bg: L.Polyline; fg: L.Polyline }>();
  private marqueurUtilisateur?: L.Marker;

  // Tracks which zones were unlocked on the previous render cycle
  // so we can detect newly unlocked zones and trigger the ripple animation
  private zonesDebloqueesPrecedentes = new Set<string>();

  constructor(readonly journeyService: JourneyService, private ngZone: NgZone) {

    // React to both zone changes AND routing geometry updates.
    // segmentsItineraire arrives a moment after zones (async OSRM fetch),
    // so the effect runs twice: first with straight-line fallbacks, then
    // again with real road geometries once OSRM responds.
    effect(() => {
      const zones    = this.journeyService.zones();
      const segments = this.journeyService.segmentsItineraire();
      if (this.mapPret()) this.mettreAJourCarte(zones, segments);
    });

    // React to GPS position changes → move user dot on map
    effect(() => {
      const pos = this.journeyService.positionUtilisateur();
      if (this.mapPret() && pos) this.mettreAJourMarqueurUtilisateur(pos);
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewInit() {
    setTimeout(async () => {
      this.initMap();
      this.mapPret.set(true);
      await this.journeyService.initialiser();
    }, 200);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  // ── Map initialization ────────────────────────────────────────────────────

  private initMap() {
    this.map = L.map('map-container', {
      center:      [-22.2660, 166.4083],
      zoom:         13,
      minZoom:      12,
      maxZoom:      18,
      zoomControl:  false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(this.map);
  }

  // ── Map update: zones ─────────────────────────────────────────────────────
  //
  // Render order matters for Leaflet's overlayPane (SVG layer):
  //   1. Territory circles  (background aura, updated in-place)
  //   2. Route polylines    (removed/re-added each tick so they sit above circles)
  //   3. Markers            (always in markerPane, above everything)

  private mettreAJourCarte(zones: JourneyZone[], segments: SegmentItineraire[]) {
    if (zones.length === 0) {
      this.zonesDebloqueesPrecedentes.clear();
      this.nettoyerTout();
      return;
    }

    const prochainId = this.journeyService.prochaineZone()?.id ?? null;

    const nouvelles: JourneyZone[] = zones.filter(
      z => z.debloque && !this.zonesDebloqueesPrecedentes.has(z.id)
    );
    this.zonesDebloqueesPrecedentes = new Set(zones.filter(z => z.debloque).map(z => z.id));

    // 1. Territory circles — only visible for unlocked zones (subtle aura)
    zones.forEach(zone => {
      if (this.overlays.has(zone.id)) {
        this.overlays.get(zone.id)!.setStyle({
          fillColor:   zone.couleurZone,
          fillOpacity: zone.debloque ? 0.08 : 0,
          color:       zone.couleurZone,
          opacity:     zone.debloque ? 0.25 : 0,
          weight:      1,
        });
      } else {
        const circle = L.circle(zone.coords, {
          radius:      zone.rayonZone,
          fillColor:   zone.couleurZone,
          fillOpacity: zone.debloque ? 0.08 : 0,
          color:       zone.couleurZone,
          weight:      1,
          opacity:     zone.debloque ? 0.25 : 0,
        });
        circle.addTo(this.map);
        this.overlays.set(zone.id, circle);
      }
    });

    // 2. Route polylines — recreated each tick so they sit above the circles
    this.mettreAJourSegments(zones, segments);

    // 3. Zone marker pins — recreated to reflect lock/next-zone state
    zones.forEach(zone => {
      this.marqueurs.get(zone.id)?.remove();
      const estProchain = zone.id === prochainId;
      const marqueur = L.marker(zone.coords, {
        icon:         this.creerIcone(zone, estProchain),
        zIndexOffset: 100
      })
        .addTo(this.map)
        .on('click', () => this.ngZone.run(() => {
          this.zoneSelectionneeId.set(zone.id);
          this.map.flyTo(zone.coords, 15, { duration: 0.8 });
        }));
      this.marqueurs.set(zone.id, marqueur);
    });

    nouvelles.forEach(z => this.animerDeblocage(z));
  }

  // ── Route polylines ───────────────────────────────────────────────────────
  //
  // Each segment between consecutive zones gets two stacked polylines:
  //   bg  — white halo for contrast against the basemap
  //   fg  — colored line reflecting unlock state
  //
  //   Unlocked segment   → solid gold line
  //   Next segment       → animated blue dashes (CSS stroke-dashoffset)
  //   Locked segment     → static gray dashes

  private mettreAJourSegments(zones: JourneyZone[], itineraires: SegmentItineraire[]) {
    this.segments.forEach(s => { s.bg.remove(); s.fg.remove(); });
    this.segments.clear();

    for (let i = 0; i < zones.length - 1; i++) {
      const a = zones[i];
      const b = zones[i + 1];
      // Use real OSRM road geometry when available, straight line as fallback
      const coords: L.LatLngExpression[] = itineraires[i]?.coordonnees.length > 1
        ? itineraires[i].coordonnees
        : [a.coords, b.coords];

      let couleur: string, poids: number, dash: string | undefined, cls: string;

      if (b.debloque) {
        // Both zones unlocked → solid gold trail
        couleur = '#c9a84c'; poids = 5; dash = undefined; cls = 'seg-debloque';
      } else if (a.debloque) {
        // Frontier segment: leads to the next zone to unlock → animated blue
        couleur = '#3498db'; poids = 4; dash = '10 6'; cls = 'seg-prochain';
      } else {
        // Future segment: both locked → faint gray dashes
        couleur = '#c0c0c0'; poids = 2; dash = '4 8'; cls = 'seg-verrouille';
      }

      const bg = L.polyline(coords, { weight: poids + 5, color: '#ffffff', opacity: 0.8 })
        .addTo(this.map);

      const fg = L.polyline(coords, {
        weight: poids, color: couleur, opacity: 0.95,
        dashArray: dash, className: cls,
      }).addTo(this.map);

      this.segments.set(String(i), { bg, fg });
    }
  }

  // ── Marker icon factory ───────────────────────────────────────────────────

  private creerIcone(zone: JourneyZone, estProchain: boolean): L.DivIcon {
    let fond: string, bordure: string, couleurNum: string, anneau: string;

    if (zone.debloque) {
      // Gold: unlocked zone
      fond = '#c9a84c'; bordure = '#8b6914'; couleurNum = '#1a2e1e'; anneau = '';
    } else if (estProchain) {
      // Blue with pulsing ring: next zone to unlock
      fond = '#ffffff'; bordure = '#3498db'; couleurNum = '#3498db';
      anneau = `<div style="
        position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;
        border-radius:50%;border:2px solid rgba(52,152,219,0.6);
        animation:pulsation 1.5s ease-out infinite;pointer-events:none;
      "></div>`;
    } else {
      // Gray: locked, not yet reachable
      fond = '#ffffff'; bordure = '#ddd'; couleurNum = '#bbb'; anneau = '';
    }

    return L.divIcon({
      className: '',
      html: `<div style="position:relative;display:inline-block;">
        ${anneau}
        <div style="
          width:42px;height:42px;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${fond};border:3px solid ${bordure};
          box-shadow:0 4px 16px rgba(0,0,0,0.2);
          display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font-size:15px;font-weight:800;color:${couleurNum};">
            ${zone.ordre}
          </span>
        </div>
      </div>`,
      iconSize:   [42, 42],
      iconAnchor: [21, 42]
    });
  }

  // ── Unlock ripple animation ───────────────────────────────────────────────
  //
  // Expands a circle outward and fades it — pure JS animation so it works
  // in SVG without relying on CSS transform-origin quirks.

  private animerDeblocage(zone: JourneyZone) {
    let rayon = 20;
    const cercle = L.circle(zone.coords, {
      radius:      rayon,
      fillColor:   '#c9a84c',
      fillOpacity: 0.5,
      color:       '#c9a84c',
      weight:      3
    }).addTo(this.map);

    const id = setInterval(() => {
      rayon += 15;
      const progression = rayon / 250;
      if (progression >= 1) {
        clearInterval(id);
        cercle.remove();
      } else {
        cercle.setRadius(rayon);
        cercle.setStyle({ fillOpacity: 0.5 * (1 - progression), opacity: 1 - progression });
      }
    }, 40);
  }

  // ── User location marker ──────────────────────────────────────────────────

  private mettreAJourMarqueurUtilisateur(pos: GeolocationPosition) {
    const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];

    if (this.marqueurUtilisateur) {
      this.marqueurUtilisateur.setLatLng(latlng);
    } else {
      this.marqueurUtilisateur = L.marker(latlng, {
        icon: L.divIcon({
          className: '',
          html: `<div class="marqueur-gps">
                   <div class="gps-anneau"></div>
                   <div class="gps-point"></div>
                 </div>`,
          iconSize:   [24, 24],
          iconAnchor: [12, 12]
        }),
        zIndexOffset: 1000
      }).addTo(this.map);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  private nettoyerTout() {
    this.marqueurs.forEach(m => m.remove());
    this.overlays.forEach(o => o.remove());
    this.segments.forEach(s => { s.bg.remove(); s.fg.remove(); });
    this.marqueurs.clear();
    this.overlays.clear();
    this.segments.clear();
  }

  // ── UI actions ────────────────────────────────────────────────────────────

  recentrer() {
    const pos = this.journeyService.positionUtilisateur();
    if (pos) {
      this.map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.8 });
    } else {
      this.map.flyTo([-22.2660, 166.4083], 13, { duration: 0.8 });
    }
  }

  fermerFiche() {
    this.zoneSelectionneeId.set(null);
  }

  async recommencer() {
    this.zoneSelectionneeId.set(null);
    await this.journeyService.reinitialiser();
  }
}
