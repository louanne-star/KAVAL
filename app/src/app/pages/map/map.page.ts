import { Component, AfterViewInit, OnDestroy, signal, computed, effect, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { JourneyService, JourneyZone, SegmentItineraire } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { RatingService } from '../../services/rating.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MapPage implements AfterViewInit, OnDestroy {

  // ── Meta locale (icône + sous-titre par zone) ─────────────────────────────

  readonly META: Record<string, { icone: string; sousTitre: string }> = {
    camp_est:    { icone: '⛏️',  sousTitre: 'Carrière & industrie' },
    vacherie:    { icone: '🌾', sousTitre: 'Agriculture & libérés' },
    hopital:     { icone: '✝️', sousTitre: 'Soins & chapelle' },
    penitencier: { icone: '🗝️', sousTitre: 'Cœur du bagne' },
    ferme_nord:  { icone: '🌊', sousTitre: 'Phare & léproserie' },
  };

  // ── Component state ───────────────────────────────────────────────────────

  private mapPret    = signal(false);
  zoneSelectionneeId = signal<string | null>(null);
  navCibleId         = signal<string | null>(null);

  zoneSelectionnee = computed(() => {
    const id = this.zoneSelectionneeId();
    return id ? (this.journeyService.zones().find(z => z.id === id) ?? null) : null;
  });

  // ── Progression basée sur les badges ─────────────────────────────────────

  readonly prochaineZoneSansBadge = computed(() =>
    this.journeyService.zones().find(z => !this.badgeService.badges().has(z.id)) ?? null
  );

  readonly badgesGagnes = computed(() =>
    this.journeyService.zones().filter(z => this.badgeService.badges().has(z.id)).length
  );

  readonly parcoursComplet = computed(() =>
    this.journeyService.zones().length === 5 &&
    this.journeyService.zones().every(z => this.badgeService.badges().has(z.id))
  );

  // ── Distance & direction en direct vers la zone sélectionnée ─────────────

  readonly distanceZone = computed(() => {
    const zone = this.zoneSelectionnee();
    const pos  = this.journeyService.positionUtilisateur();
    if (!zone || !pos) return null;
    return Math.round(this.journeyService.haversine(
      pos.coords.latitude, pos.coords.longitude,
      zone.coords[0], zone.coords[1]
    ));
  });

  readonly tempsMarche = computed(() => {
    const d = this.distanceZone();
    return d !== null ? Math.max(1, Math.round(d / 83)) : null;
  });

  readonly flecheVersZone = computed(() => {
    const zone = this.zoneSelectionnee();
    const pos  = this.journeyService.positionUtilisateur();
    if (!zone || !pos) return null;
    return this.journeyService.getFlecheVers(
      pos.coords.latitude, pos.coords.longitude,
      zone.coords[0], zone.coords[1]
    );
  });

  // ── Leaflet handles: zone layer ───────────────────────────────────────────

  private map!: L.Map;
  private marqueurs = new Map<string, L.Marker>();
  private overlays  = new Map<string, L.Circle>();
  private segments  = new Map<string, { bg: L.Polyline; fg: L.Polyline }>();

  // ── Leaflet handles: live navigation (user → next zone) ───────────────────

  private navLigne?: { bg: L.Polyline; fg: L.Polyline };
  private navAbortCtrl?: AbortController;
  private navDernierePosition: [number, number] | null = null;
  // Debounce: only refetch OSRM route when user has moved > 30m
  private readonly NAV_SEUIL_METRES = 30;

  // ── Leaflet handles: user dot ─────────────────────────────────────────────

  private marqueurUtilisateur?: L.Marker;

  constructor(
    readonly journeyService: JourneyService,
    readonly ratingService: RatingService,
    readonly favoriteService: FavoriteService,
    private ngZone: NgZone,
    private router: Router,
    readonly badgeService: BadgeService,
  ) {

    // Redraws zone circles, ghost segments and markers when zones or OSRM
    // geometries change. The effect reads both signals so it fires on either.
    effect(() => {
      const zones    = this.journeyService.zones();
      const segments = this.journeyService.segmentsItineraire();
      if (this.mapPret()) this.mettreAJourCarte(zones, segments);
    });

    // Moves the user dot AND refreshes the live nav route on every GPS fix.
    effect(() => {
      const pos = this.journeyService.positionUtilisateur();
      if (this.mapPret() && pos) {
        this.mettreAJourMarqueurUtilisateur(pos);
        this.mettreAJourNavigation(pos);
      }
    });

    // Redessine immédiatement la route quand la cible change.
    effect(() => {
      this.navCibleId(); // subscribe
      const pos = this.journeyService.positionUtilisateur();
      if (this.mapPret() && pos) this.mettreAJourNavigation(pos);
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
    this.navAbortCtrl?.abort();
    this.map?.remove();
  }

  // ── Map initialization ────────────────────────────────────────────────────

  private initMap() {
    this.map = L.map('map-container', {
      center:      [-22.2660, 166.4083],
      zoom:         14,
      minZoom:      12,
      maxZoom:      19,
      zoomControl:  false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(this.map);
  }

  // ── Zone layer update ─────────────────────────────────────────────────────
  //
  // Render order inside Leaflet's overlayPane (SVG):
  //   1. Territory circles   — subtle aura around unlocked zones
  //   2. Ghost segments      — full zone-to-zone paths (faint background)
  //   3. Markers             — always in markerPane, above SVG layer

  private mettreAJourCarte(zones: JourneyZone[], itineraires: SegmentItineraire[]) {
    if (zones.length === 0) {
      this.nettoyerTout();
      return;
    }

    const prochainId = this.prochaineZoneSansBadge()?.id ?? null;

    // 1. Territory aura circles (updated in-place for CSS transition)
    zones.forEach(zone => {
      if (this.overlays.has(zone.id)) {
        this.overlays.get(zone.id)!.setStyle({
          fillColor:   zone.couleurZone,
          fillOpacity: zone.debloque ? 0.08 : 0,
          color:       zone.couleurZone,
          opacity:     zone.debloque ? 0.2 : 0,
          weight:      1,
        });
      } else {
        const c = L.circle(zone.coords, {
          radius:      zone.rayonZone,
          fillColor:   zone.couleurZone,
          fillOpacity: zone.debloque ? 0.08 : 0,
          color:       zone.couleurZone,
          weight:      1,
          opacity:     zone.debloque ? 0.2 : 0,
        }).addTo(this.map);
        this.overlays.set(zone.id, c);
      }
    });

    // 2. Ghost segments: zone-to-zone full paths shown as background reference
    this.mettreAJourSegments(zones, itineraires);

    // 3. Zone marker pins
    zones.forEach(zone => {
      this.marqueurs.get(zone.id)?.remove();
      const marqueur = L.marker(zone.coords, {
        icon:         this.creerIcone(zone, zone.id === prochainId),
        zIndexOffset: 100
      })
        .addTo(this.map)
        .on('click', () => this.ngZone.run(() => {
          this.zoneSelectionneeId.set(zone.id);
          this.map.flyTo(zone.coords, 15, { duration: 0.8 });
        }));
      this.marqueurs.set(zone.id, marqueur);
    });

  }

  // ── Ghost segments (zone-to-zone background paths) ────────────────────────

  private mettreAJourSegments(zones: JourneyZone[], itineraires: SegmentItineraire[]) {
    this.segments.forEach(s => { s.bg.remove(); s.fg.remove(); });
    this.segments.clear();

    for (let i = 0; i < zones.length - 1; i++) {
      const a = zones[i];
      const b = zones[i + 1];
      const coords: L.LatLngExpression[] = itineraires[i]?.coordonnees.length > 1
        ? itineraires[i].coordonnees
        : [a.coords, b.coords];

      let couleur: string, poids: number, opacite: number, dash: string | undefined;

      const badges = this.badgeService.badges();
      if (badges.has(b.id)) {
        couleur = '#c9a84c'; poids = 5; opacite = 0.95; dash = undefined;
      } else if (badges.has(a.id)) {
        couleur = '#3498db'; poids = 2; opacite = 0.25; dash = '6 6';
      } else {
        couleur = '#bbb'; poids = 2; opacite = 0.4; dash = '4 8';
      }

      const bg = L.polyline(coords, { weight: poids + 4, color: '#ffffff', opacity: opacite * 0.8 }).addTo(this.map);
      const fg = L.polyline(coords, { weight: poids, color: couleur, opacity: opacite, dashArray: dash }).addTo(this.map);
      this.segments.set(String(i), { bg, fg });
    }
  }

  // ── Live navigation: user position → next zone ────────────────────────────
  //
  // Requests an OSRM walking route from the user's current GPS position to
  // the next locked zone. Only refetches when the user has moved > 30m,
  // cancelling any in-flight request first via AbortController.
  // Falls back silently (keeps the last line) on network error.

  private async mettreAJourNavigation(pos: GeolocationPosition) {
    const cibleId   = this.navCibleId();
    const prochaine = cibleId
      ? (this.journeyService.zones().find(z => z.id === cibleId) ?? null)
      : this.prochaineZoneSansBadge();

    if (!prochaine) {
      this.supprimerNavActive();
      return;
    }

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Skip fetch if user hasn't moved enough
    if (this.navDernierePosition) {
      const dist = this.journeyService.haversine(lat, lng, this.navDernierePosition[0], this.navDernierePosition[1]);
      if (dist < this.NAV_SEUIL_METRES) return;
    }

    this.navDernierePosition = [lat, lng];
    this.navAbortCtrl?.abort();
    this.navAbortCtrl = new AbortController();
    const signal = this.navAbortCtrl.signal;

    try {
      // OSRM expects lng,lat order
      const url = `https://router.project-osrm.org/route/v1/foot/${lng},${lat};${prochaine.coords[1]},${prochaine.coords[0]}?overview=full&geometries=geojson`;
      const resp = await fetch(url, { signal });
      if (!resp.ok || signal.aborted) return;

      const data = await resp.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return;

      // Convert OSRM [lng, lat] → Leaflet [lat, lng]
      const coords: L.LatLngExpression[] = (data.routes[0].geometry.coordinates as [number, number][])
        .map(([lo, la]) => [la, lo]);

      // Draw or update inside Angular zone so the map re-renders correctly
      this.ngZone.run(() => this.dessinerNavActive(coords));

    } catch {
      // AbortError or network failure — keep the last drawn line
    }
  }

  private dessinerNavActive(coords: L.LatLngExpression[]) {
    if (this.navLigne) {
      this.navLigne.bg.setLatLngs(coords);
      this.navLigne.fg.setLatLngs(coords);
    } else {
      const bg = L.polyline(coords, { weight: 10, color: '#ffffff', opacity: 0.85 }).addTo(this.map);
      const fg = L.polyline(coords, {
        weight: 5, color: '#3498db', opacity: 1,
        dashArray: '10 5', className: 'seg-prochain'
      }).addTo(this.map);
      this.navLigne = { bg, fg };
    }
  }

  private supprimerNavActive() {
    this.navLigne?.bg.remove();
    this.navLigne?.fg.remove();
    this.navLigne = undefined;
    this.navDernierePosition = null;
  }

  // ── Marker icon factory ───────────────────────────────────────────────────

  private creerIcone(zone: JourneyZone, estProchain: boolean): L.DivIcon {
    let fond: string, bordure: string, couleurNum: string, anneau: string;

    if (zone.debloque) {
      fond = '#c9a84c'; bordure = '#8b6914'; couleurNum = '#1a2e1e'; anneau = '';
    } else if (estProchain) {
      fond = '#ffffff'; bordure = '#3498db'; couleurNum = '#3498db';
      anneau = `<div style="
        position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;
        border-radius:50%;border:2px solid rgba(52,152,219,0.6);
        animation:pulsation 1.5s ease-out infinite;pointer-events:none;
      "></div>`;
    } else {
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

  // ── User GPS dot ──────────────────────────────────────────────────────────

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
          iconSize: [24, 24], iconAnchor: [12, 12]
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
    this.supprimerNavActive();
    this.marqueurs.clear();
    this.overlays.clear();
    this.segments.clear();
    this.marqueurUtilisateur?.remove();
    this.marqueurUtilisateur = undefined;
  }

  // ── UI actions ────────────────────────────────────────────────────────────

  recentrer() {
    const pos = this.journeyService.positionUtilisateur();
    if (pos) {
      this.map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.8 });
    } else {
      this.map.flyTo([-22.2660, 166.4083], 14, { duration: 0.8 });
    }
  }

  explorer(zoneId: string) {
    this.fermerFiche();
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zoneId } });
  }

  fermerFiche() {
    this.zoneSelectionneeId.set(null);
    this.navCibleId.set(null);
  }

  toggleItineraire(zoneId: string) {
    const actif = this.navCibleId() === zoneId;
    this.navCibleId.set(actif ? null : zoneId);
    if (!actif) {
      // Ferme la fiche et zoom pour montrer le tracé
      this.zoneSelectionneeId.set(null);
      const zone = this.journeyService.zones().find(z => z.id === zoneId);
      const pos  = this.journeyService.positionUtilisateur();
      if (zone && pos) {
        const bounds = L.latLngBounds(
          [pos.coords.latitude, pos.coords.longitude],
          zone.coords
        );
        this.map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }

  async toggleFavori(zoneId: string) {
    await this.favoriteService.toggle(zoneId);
  }

  async noterZone(zoneId: string, note: number) {
    await this.ratingService.noter(zoneId, note);
  }

  starsFor(note: number | null): string {
    if (!note) return '☆☆☆☆☆';
    const n = Math.round(note);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  async recommencer() {
    this.zoneSelectionneeId.set(null);
    await Promise.all([
      this.journeyService.reinitialiser(),
      this.badgeService.reinitialiser(),
      this.ratingService.reinitialiser(),
      this.favoriteService.reinitialiser(),
    ]);
  }
}
