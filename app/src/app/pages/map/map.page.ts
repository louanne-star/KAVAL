import { Component, AfterViewInit, OnDestroy, signal, computed, effect, untracked, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { JourneyService, JourneyZone, SegmentItineraire } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { RatingService } from '../../services/rating.service';
import { FavoriteService } from '../../services/favorite.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

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

  // ── Navigation active : cible + instruction OSRM ─────────────────────────

  instructionNav = signal<{ texte: string; icone: string; distance: number } | null>(null);
  zoneArrivee    = signal<JourneyZone | null>(null);

  readonly navCibleZone = computed(() => {
    const cibleId = this.navCibleId();
    if (!cibleId) return null;
    return this.journeyService.zones().find(z => z.id === cibleId) ?? null;
  });

  readonly distanceNavCible = computed(() => {
    const zone = this.navCibleZone();
    const pos  = this.journeyService.positionUtilisateur();
    if (!zone || !pos) return null;
    return Math.round(this.journeyService.haversine(
      pos.coords.latitude, pos.coords.longitude,
      zone.coords[0], zone.coords[1]
    ));
  });

  // ── Leaflet handles: zone layer ───────────────────────────────────────────

  modeSatellite = signal(false);

  private map!: L.Map;
  private tileNormale!:   L.TileLayer;
  private tileSatellite!: L.TileLayer;
  private marqueurs = new Map<string, L.Marker>();
  private overlays  = new Map<string, L.Circle>();
  private segments  = new Map<string, { bg: L.Polyline; fg: L.Polyline }>();

  // ── Leaflet handles: live navigation (user → next zone) ───────────────────

  private navLigne?: { bg: L.Polyline; fg: L.Polyline };
  private navAbortCtrl?: AbortController;
  private navDernierePosition: [number, number] | null = null;
  private readonly NAV_SEUIL_METRES = 30;

  // ── Leaflet handles: user dot ─────────────────────────────────────────────

  private marqueurUtilisateur?: L.Marker;

  // ── Arrivée ───────────────────────────────────────────────────────────────

  private arriveeDejaTraitee = new Set<string>();
  private arriveeTimeout?: ReturnType<typeof setTimeout>;

  // ── OSRM instruction maps ─────────────────────────────────────────────────

  private readonly MODIFIER_FR: Record<string, string> = {
    'left':         'Tournez à gauche',
    'right':        'Tournez à droite',
    'straight':     'Continuez tout droit',
    'slight left':  'Légèrement à gauche',
    'slight right': 'Légèrement à droite',
    'sharp left':   'Virage serré à gauche',
    'sharp right':  'Virage serré à droite',
    'uturn':        'Demi-tour',
  };

  private readonly MODIFIER_ICONE: Record<string, string> = {
    'left':         '↰',
    'right':        '↱',
    'straight':     '↑',
    'slight left':  '↖',
    'slight right': '↗',
    'sharp left':   '↩',
    'sharp right':  '↪',
    'uturn':        '↩',
  };

  // ── Commentaire ───────────────────────────────────────────────────────────

  commentaireOuvert = signal<string | null>(null); // zoneId de la modale ouverte
  brouillonCommentaire = '';

  ouvrirCommentaire(zoneId: string) {
    this.brouillonCommentaire = this.commentService.getCommentaire(zoneId) ?? '';
    this.commentaireOuvert.set(zoneId);
    this.commentService.chargerCommentairesZone(zoneId);
  }

  formatDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return 'à l\'instant';
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
  }

  fermerCommentaire() {
    this.commentaireOuvert.set(null);
  }

  async sauvegarderCommentaire(zoneId: string) {
    await this.commentService.commenter(zoneId, this.brouillonCommentaire.trim());
    this.commentaireOuvert.set(null);
  }

  constructor(
    readonly journeyService: JourneyService,
    readonly ratingService: RatingService,
    readonly favoriteService: FavoriteService,
    readonly commentService: CommentService,
    readonly authService: AuthService,
    private ngZone: NgZone,
    private router: Router,
    readonly badgeService: BadgeService,
  ) {

    // Redessine les cercles, segments et marqueurs quand les zones ou l'itinéraire changent.
    effect(() => {
      const zones    = this.journeyService.zones();
      const segments = this.journeyService.segmentsItineraire();
      if (this.mapPret()) this.mettreAJourCarte(zones, segments);
    });

    // Déplace le point GPS, met à jour la navigation live et vérifie les arrivées.
    effect(() => {
      const pos = this.journeyService.positionUtilisateur();
      if (this.mapPret() && pos) {
        this.mettreAJourMarqueurUtilisateur(pos);
        this.mettreAJourNavigation(pos);
        this.verifierArrivees(pos);
      }
    });

    // Force un nouveau fetch OSRM quand la cible change.
    effect(() => {
      this.navCibleId(); // subscribe
      this.navDernierePosition = null;
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
      this.ratingService.chargerMoyennes();
    }, 200);
  }

  ngOnDestroy() {
    this.navAbortCtrl?.abort();
    clearTimeout(this.arriveeTimeout);
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

    this.tileNormale = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO', maxZoom: 19 }
    ).addTo(this.map);

    this.tileSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri, DigitalGlobe', maxZoom: 19 }
    );
  }

  // ── Zone layer update ─────────────────────────────────────────────────────

  private mettreAJourCarte(zones: JourneyZone[], itineraires: SegmentItineraire[]) {
    if (zones.length === 0) {
      this.nettoyerTout();
      return;
    }

    const prochainId = this.prochaineZoneSansBadge()?.id ?? null;

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

    this.mettreAJourSegments(zones, itineraires);

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

  // ── Ghost segments ────────────────────────────────────────────────────────

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

    if (this.navDernierePosition) {
      const dist = this.journeyService.haversine(lat, lng, this.navDernierePosition[0], this.navDernierePosition[1]);
      if (dist < this.NAV_SEUIL_METRES) return;
    }

    this.navDernierePosition = [lat, lng];
    this.navAbortCtrl?.abort();
    this.navAbortCtrl = new AbortController();
    const signal = this.navAbortCtrl.signal;

    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${lng},${lat};${prochaine.coords[1]},${prochaine.coords[0]}?overview=full&geometries=geojson&steps=true`;
      const resp = await fetch(url, { signal });
      if (!resp.ok || signal.aborted) return;

      const data = await resp.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return;

      const coords: L.LatLngExpression[] = (data.routes[0].geometry.coordinates as [number, number][])
        .map(([lo, la]) => [la, lo]);

      const steps = data.routes[0].legs?.[0]?.steps ?? [];
      const instruction = this.parseInstruction(steps);

      this.ngZone.run(() => {
        this.dessinerNavActive(coords);
        this.instructionNav.set(instruction);
      });

    } catch {
      // AbortError ou panne réseau — garde le dernier tracé
    }
  }

  private parseInstruction(steps: any[]): { texte: string; icone: string; distance: number } | null {
    if (!steps?.length) return null;
    const premierPas    = steps[0];
    const prochainVirage = steps[1];

    if (!prochainVirage || prochainVirage.maneuver?.type === 'arrive') {
      return { texte: 'Continuez tout droit', icone: '↑', distance: Math.round(premierPas.distance ?? 0) };
    }

    const modifier = prochainVirage.maneuver?.modifier ?? 'straight';
    return {
      texte:    this.MODIFIER_FR[modifier]    ?? 'Continuez tout droit',
      icone:    this.MODIFIER_ICONE[modifier] ?? '↑',
      distance: Math.round(premierPas.distance ?? 0),
    };
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
    this.instructionNav.set(null);
  }

  // ── Détection d'arrivée ───────────────────────────────────────────────────

  private verifierArrivees(pos: GeolocationPosition) {
    const lat   = pos.coords.latitude;
    const lng   = pos.coords.longitude;
    const zones = untracked(() => this.journeyService.zones());

    for (const zone of zones) {
      const dejaBadge = untracked(() => this.badgeService.aBadge(zone.id));
      if (dejaBadge || this.arriveeDejaTraitee.has(zone.id)) continue;

      const dist = this.journeyService.haversine(lat, lng, zone.coords[0], zone.coords[1]);
      if (dist > zone.rayonZone) continue;

      this.arriveeDejaTraitee.add(zone.id);
      this.badgeService.gagnerBadge(zone.id).then(() => {
        this.ngZone.run(() => {
          // Si la zone arrivée était la cible nav active, on la réinitialise
          if (this.navCibleId() === zone.id) this.navCibleId.set(null);

          // Affiche la notification d'arrivée
          this.zoneArrivee.set(zone);
          clearTimeout(this.arriveeTimeout);
          this.arriveeTimeout = setTimeout(() => {
            if (this.zoneArrivee()?.id === zone.id) this.zoneArrivee.set(null);
          }, 5000);
        });
      });
    }
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

  toggleModeCarte() {
    const satellite = !this.modeSatellite();
    this.modeSatellite.set(satellite);
    if (satellite) {
      this.tileNormale.remove();
      this.tileSatellite.addTo(this.map);
    } else {
      this.tileSatellite.remove();
      this.tileNormale.addTo(this.map);
    }
  }

  allerVersCompte() {
    this.router.navigate(['/compte']);
  }

  allerVersRecherche() {
    this.router.navigate(['/recherche']);
  }

  allerVersFavoris() {
    this.router.navigate(['/favoris']);
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

  annulerNav() {
    this.navCibleId.set(null);
    this.supprimerNavActive();
  }

  fermerArrivee() {
    clearTimeout(this.arriveeTimeout);
    this.zoneArrivee.set(null);
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
    this.arriveeDejaTraitee.clear();
    this.zoneArrivee.set(null);
    clearTimeout(this.arriveeTimeout);
    await Promise.all([
      this.journeyService.reinitialiser(),
      this.badgeService.reinitialiser(),
      this.ratingService.reinitialiser(),
      this.favoriteService.reinitialiser(),
      this.commentService.reinitialiser(),
    ]);
  }
}
