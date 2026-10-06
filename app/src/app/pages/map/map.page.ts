import { Component, AfterViewInit, OnDestroy, signal, computed, effect, untracked, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { earthOutline, mapOutline, searchOutline, heartOutline, heart, carOutline, walkOutline, chatbubbleEllipsesOutline, send } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import maplibreGL from '@maplibre/maplibre-gl-leaflet';
import { JourneyService, JourneyZone, SegmentItineraire } from '../../services/journey.service';
import { BadgeService } from '../../services/badge.service';
import { RatingService } from '../../services/rating.service';
import { FavoriteService } from '../../services/favorite.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { PointsService, PointPopup } from '../../services/points.service';
import { UiStateService } from '../../services/ui-state.service';
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

// Points "phares" : chacun a son propre mini-jeu dédié (contrairement aux
// autres points d'une même zone, qui n'en ont pas) — c'est ce qui leur vaut
// l'étoile sur la carte. Doit rester synchronisé avec les clés de JEUX dans
// parcours.page.ts à chaque nouveau mini-jeu.
const POINTS_PHARES = new Set(['camp_est_principal', 'magasin_a_vivre', 'boulangerie', 'hopital_du_marais']);

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class MapPage implements AfterViewInit, OnDestroy {

  // ── Component state ───────────────────────────────────────────────────────

  private mapPret    = signal(false);
  zoneSelectionneeId = signal<string | null>(null);
  navCibleId         = signal<string | null>(null);
  private pointAOuvrirId = signal<string | null>(null);
  private routeSub?: Subscription;

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
    this.journeyService.zones().length > 0 &&
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

  instructionNav = signal<{ modifierKey: string; icone: string; distance: number } | null>(null);
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

  modeSatellite        = signal(false);
  modeTransport        = signal<'foot' | 'driving'>('foot');
  miniPointSelectionne = signal<PointPopup | null>(null);
  miniPopupPos         = signal<{ x: number; y: number } | null>(null);

  private map!: L.Map;
  private tileNormale!:   L.MaplibreGL;
  private tileSatellite!: L.TileLayer;
  private marqueurs = new Map<string, L.Marker>();
  private overlays  = new Map<string, L.Circle>();
  private segments     = new Map<string, { bg: L.Polyline; fg: L.Polyline }>();
  private popupMarqueurs: L.Marker[] = [];

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

  private readonly MODIFIER_KEY: Record<string, string> = {
    'left':         'left',
    'right':        'right',
    'straight':     'straight',
    'slight left':  'slightLeft',
    'slight right': 'slightRight',
    'sharp left':   'sharpLeft',
    'sharp right':  'sharpRight',
    'uturn':        'uturn',
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
    this.brouillonCommentaire = '';
    this.commentaireOuvert.set(zoneId);
    this.commentService.chargerCommentairesZone(zoneId);
  }

  formatDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return this.translate.instant('carte.commentaires.temps.instant');
    if (diff < 3600)  return this.translate.instant('carte.commentaires.temps.min',   { n: Math.floor(diff / 60) });
    if (diff < 86400) return this.translate.instant('carte.commentaires.temps.heure', { n: Math.floor(diff / 3600) });
    return this.translate.instant('carte.commentaires.temps.jour', { n: Math.floor(diff / 86400) });
  }

  fermerCommentaire() {
    this.commentaireOuvert.set(null);
  }

  async sauvegarderCommentaire(zoneId: string) {
    const texte = this.brouillonCommentaire.trim();
    if (!texte) return;
    this.brouillonCommentaire = '';
    await this.commentService.commenter(zoneId, texte);
  }

  constructor(
    readonly journeyService: JourneyService,
    readonly ratingService: RatingService,
    readonly favoriteService: FavoriteService,
    readonly commentService: CommentService,
    readonly authService: AuthService,
    readonly pointsService: PointsService,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    readonly badgeService: BadgeService,
    readonly uiState: UiStateService,
    readonly languageService: LanguageService,
    private translate: TranslateService,
  ) {
    addIcons({ earthOutline, mapOutline, searchOutline, heartOutline, heart, carOutline, walkOutline, chatbubbleEllipsesOutline, send });

    // Reçoit l'id d'un point à ouvrir automatiquement (ex: retour depuis sa
    // page détail dans Parcours, via /tabs/carte?point=<id>).
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const id = params.get('point');
      if (id) this.pointAOuvrirId.set(id);
    });

    // Dès que la carte et les zones sont prêtes, ouvre le point demandé comme
    // un clic sur son marqueur (sheet + centrage), puis nettoie l'URL.
    effect(() => {
      const id    = this.pointAOuvrirId();
      const zones = this.journeyService.zones();
      if (!id || !this.mapPret() || zones.length === 0) return;
      const zone = zones.find(z => z.id === id);
      if (!zone) return;
      untracked(() => {
        this.miniPointSelectionne.set(null);
        this.miniPopupPos.set(null);
        this.zoneSelectionneeId.set(zone.id);
        this.map.flyTo(zone.coords, 15, { duration: 0.8 });
        this.pointAOuvrirId.set(null);
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      });
    });

    // Retour depuis la fiche détail d'un point (bouton "← Retour", navigation
    // navigateur) : rouvre la fiche exactement où on l'avait laissée — même
    // zoom, même centrage — plutôt qu'un zoom fixe arbitraire.
    effect(() => {
      const etat  = this.uiState.pointARouvrir();
      const zones = this.journeyService.zones();
      if (!etat || !this.mapPret() || zones.length === 0) return;
      const zone = zones.find(z => z.id === etat.pointId);
      if (!zone) return;
      untracked(() => {
        this.miniPointSelectionne.set(null);
        this.miniPopupPos.set(null);
        this.zoneSelectionneeId.set(zone.id);
        this.map.flyTo([etat.lat, etat.lng], etat.zoom, { duration: 0.8 });
        this.uiState.pointARouvrir.set(null);
      });
    });

    // Redessine les cercles, segments et marqueurs quand les zones, l'itinéraire ou la cible nav changent.
    effect(() => {
      const zones    = this.journeyService.zones();
      const segments = this.journeyService.segmentsItineraire();
      this.navCibleId(); // masque/affiche les segments selon l'état nav
      if (this.mapPret()) this.mettreAJourCarte(zones, segments);
    });

    // Affiche tous les points popup dès que le contenu est chargé — indépendant des badges/itinéraire.
    effect(() => {
      const popups = this.pointsService.pointsPopup();
      if (this.mapPret()) this.dessinerPopups(popups);
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

    // Refetch nav avec le nouveau profil quand le mode transport change.
    effect(() => {
      this.modeTransport(); // subscribe
      if (!untracked(() => this.mapPret())) return;
      this.supprimerNavActive();
      this.navDernierePosition = null;
      const pos = untracked(() => this.journeyService.positionUtilisateur());
      if (pos) this.mettreAJourNavigation(pos);
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.mapPret.set(true);
      this.ratingService.chargerMoyennes();
    }, 200);
  }

  ngOnDestroy() {
    this.navAbortCtrl?.abort();
    clearTimeout(this.arriveeTimeout);
    this.routeSub?.unsubscribe();
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

    // Fond de carte vectoriel sobre (style "Positron" d'OpenFreeMap, gratuit
    // et sans clé API — contrairement à Mapbox/CARTO/Stadia), avec une ombre
    // ajoutée sous les bâtiments pour un effet de relief façon carte Snap —
    // la bascule maplibre-gl-leaflet ne supportant pas l'inclinaison de
    // caméra (pitch), on simule le volume avec un fill-translate plutôt
    // qu'une vraie extrusion 3D.
    this.tileNormale = maplibreGL({
      style: 'https://tiles.openfreemap.org/styles/positron'
    }).addTo(this.map);

    this.tileNormale.getMaplibreMap().on('load', () => {
      const gl = this.tileNormale.getMaplibreMap();

      // Petits arbres dispersés aléatoirement sur les zones de parc/bois,
      // façon cartes Snap — pas de données de points d'arbres individuels
      // dans les tuiles OpenMapTiles, donc on sème des points au hasard à
      // l'intérieur des polygones, avec 3 tailles/variantes pour un rendu
      // naturel plutôt qu'une grille régulière.
      const dessinerArbre = (r: number, teinte: string, teinteClaire: string) => {
        const t = Math.ceil(r * 2.6);
        const canvas = document.createElement('canvas');
        canvas.width = t; canvas.height = t;
        const ctx = canvas.getContext('2d')!;
        const cx = t / 2, cy = t / 2;
        ctx.beginPath();
        ctx.ellipse(cx + 1.5, cy + r * 0.85, r * 0.85, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(70, 65, 40, 0.18)';
        ctx.fill();
        const degrade = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        degrade.addColorStop(0, teinteClaire);
        degrade.addColorStop(1, teinte);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = degrade;
        ctx.fill();
        return ctx.getImageData(0, 0, t, t);
      };
      gl.addImage('arbre-s', dessinerArbre(4.5, '#6cad57', '#9ed083'));
      gl.addImage('arbre-m', dessinerArbre(6,   '#5fa84a', '#92c877'));
      gl.addImage('arbre-l', dessinerArbre(7.5, '#549c40', '#86bd6c'));

      const dansAnneau = (pt: [number, number], anneau: [number, number][]) => {
        let dedans = false;
        for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
          const [xi, yi] = anneau[i], [xj, yj] = anneau[j];
          const croise = (yi > pt[1]) !== (yj > pt[1]) &&
            pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
          if (croise) dedans = !dedans;
        }
        return dedans;
      };
      const dansPolygone = (pt: [number, number], geometrie: GeoJSON.Geometry) => {
        const polygones = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.type === 'MultiPolygon' ? geometrie.coordinates : [];
        return polygones.some(([exterieur, ...trous]) =>
          dansAnneau(pt, exterieur as [number, number][]) && !trous.some(t => dansAnneau(pt, t as [number, number][]))
        );
      };

      gl.addSource('arbres', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      gl.addLayer({
        id: 'arbres',
        type: 'symbol',
        source: 'arbres',
        minzoom: 15,
        layout: {
          'icon-image': ['get', 'variante'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      }, 'building');

      const polygonesSemes = new Set<string>();
      const arbresSemés: GeoJSON.Feature[] = [];
      const variantes = ['arbre-s', 'arbre-m', 'arbre-l'];

      const semerArbres = () => {
        const zones = gl.queryRenderedFeatures(undefined, { layers: ['park', 'landcover_wood'] });
        let ajoutes = false;
        for (const zone of zones) {
          const anneaux = zone.geometry.type === 'Polygon' ? [zone.geometry.coordinates[0]]
            : zone.geometry.type === 'MultiPolygon' ? zone.geometry.coordinates.map(p => p[0])
            : [];
          if (anneaux.length === 0) continue;

          const cle = `${zone.layer.id}:${zone.id ?? JSON.stringify(anneaux[0]?.[0])}`;
          if (polygonesSemes.has(cle)) continue;
          polygonesSemes.add(cle);

          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          anneaux.forEach(a => a.forEach(([x, y]) => {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }));
          if (!isFinite(minX)) continue;

          let posees = 0;
          for (let essai = 0; essai < 400 && posees < 45; essai++) {
            const pt: [number, number] = [minX + Math.random() * (maxX - minX), minY + Math.random() * (maxY - minY)];
            if (!dansPolygone(pt, zone.geometry)) continue;
            arbresSemés.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: pt },
              properties: { variante: variantes[Math.floor(Math.random() * variantes.length)] },
            });
            posees++;
            ajoutes = true;
          }
        }
        if (ajoutes) {
          (gl.getSource('arbres') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: arbresSemés });
        }
      };

      gl.once('idle', semerArbres);
      gl.on('moveend', semerArbres);

      gl.addLayer({
        id: 'building-shadow',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': 'rgba(120, 95, 60, 0.32)',
          'fill-translate': [3, 5],
          'fill-translate-anchor': 'viewport',
        },
      }, 'building');

      // Repasse la palette grise de "Positron" sur des tons pastel chauds
      // (crème/beige/vert tendre), façon carte Snap, plutôt que le gris froid
      // d'origine du style.
      gl.setPaintProperty('background',           'background-color', '#f7f2e7');
      gl.setPaintProperty('landuse_residential',   'fill-color',       '#f3ebd9');
      gl.setPaintProperty('park',                  'fill-color',       '#def0c6');
      gl.setPaintProperty('landcover_wood',        'fill-color',       '#d3ebbc');
      gl.setPaintProperty('water',                 'fill-color',       '#cfe3ee');
      gl.setPaintProperty('building',              'fill-color',       '#ecdfc3');
      gl.setPaintProperty('building',              'fill-outline-color', '#d9c9a0');
    });

    this.tileSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri, DigitalGlobe', maxZoom: 19 }
    );

    // Garde la bulle du mini-point collée à son marqueur pendant les pans/zooms.
    this.map.on('move', () => this.ngZone.run(() => this.mettreAJourPositionMiniPopup()));
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
          this.miniPointSelectionne.set(null);
          this.miniPopupPos.set(null);
          this.zoneSelectionneeId.set(zone.id);
        }));
      this.marqueurs.set(zone.id, marqueur);
    });
  }

  // ── Ghost segments ────────────────────────────────────────────────────────

  private mettreAJourSegments(zones: JourneyZone[], itineraires: SegmentItineraire[]) {
    this.segments.forEach(s => { s.bg.remove(); s.fg.remove(); });
    this.segments.clear();

    // Pendant la navigation active, on n'affiche que le tracé OSRM live —
    // sauf si on n'a pas de position réelle, auquel cas ce tracé live ne peut
    // jamais se dessiner : on garde alors le tracé fantôme pour ne pas laisser
    // la carte sans aucune ligne.
    if (untracked(() => this.navCibleId()) && untracked(() => this.journeyService.positionUtilisateur())) return;

    for (let i = 0; i < zones.length - 1; i++) {
      const a = zones[i];
      const b = zones[i + 1];
      const coords: L.LatLngExpression[] = itineraires[i]?.coordonnees.length > 1
        ? itineraires[i].coordonnees
        : [a.coords, b.coords];

      let couleur: string, poidsCore: number, poidsBord: number, opacite: number, dash: string | undefined, className: string | undefined;

      const badges = this.badgeService.badges();
      if (badges.has(b.id)) {
        // Segment complété : navy plein bien visible
        couleur = '#27476e'; poidsCore = 6; poidsBord = 12; opacite = 0.95; dash = undefined; className = undefined;
      } else if (badges.has(a.id)) {
        // Segment prochain : bleu animé
        couleur = '#3498db'; poidsCore = 4; poidsBord = 10; opacite = 0.9; dash = '12 7'; className = 'seg-prochain';
      } else {
        // Segments futurs : discrets mais lisibles sur le fond de carte clair
        couleur = '#8a93a6'; poidsCore = 3; poidsBord = 7; opacite = 0.55; dash = '4 8'; className = undefined;
      }

      const bg = L.polyline(coords, { weight: poidsBord, color: '#ffffff', opacity: opacite }).addTo(this.map);
      const fg = L.polyline(coords, { weight: poidsCore, color: couleur, opacity: opacite, dashArray: dash, className }).addTo(this.map);
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
      const profil = untracked(() => this.modeTransport());
      const url = `https://router.project-osrm.org/route/v1/${profil}/${lng},${lat};${prochaine.coords[1]},${prochaine.coords[0]}?overview=full&geometries=geojson&steps=true`;
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

  private parseInstruction(steps: any[]): { modifierKey: string; icone: string; distance: number } | null {
    if (!steps?.length) return null;
    const premierPas    = steps[0];
    const prochainVirage = steps[1];

    if (!prochainVirage || prochainVirage.maneuver?.type === 'arrive') {
      return { modifierKey: 'straight', icone: '↑', distance: Math.round(premierPas.distance ?? 0) };
    }

    const modifier = prochainVirage.maneuver?.modifier ?? 'straight';
    return {
      modifierKey: this.MODIFIER_KEY[modifier]   ?? 'straight',
      icone:       this.MODIFIER_ICONE[modifier] ?? '↑',
      distance:    Math.round(premierPas.distance ?? 0),
    };
  }

  private dessinerNavActive(coords: L.LatLngExpression[]) {
    const estVoiture  = untracked(() => this.modeTransport()) === 'driving';
    const couleur     = estVoiture ? '#E07B39' : '#2980b9';
    const dash        = estVoiture ? undefined  : '14 6';
    const poidsCore   = estVoiture ? 8          : 7;
    const poidsBord   = 16;

    if (this.navLigne) {
      this.navLigne.bg.setLatLngs(coords);
      this.navLigne.fg.setLatLngs(coords);
      this.navLigne.fg.setStyle({ color: couleur, dashArray: dash, weight: poidsCore });
    } else {
      const bg = L.polyline(coords, { weight: poidsBord, color: '#ffffff', opacity: 0.95 }).addTo(this.map);
      const fg = L.polyline(coords, {
        weight: poidsCore, color: couleur, opacity: 1,
        dashArray: dash,
        className: estVoiture ? '' : 'seg-prochain'
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

  private readonly PIN_PATH  = 'M16 1C8.3 1 2 7.3 2 15C2 25.5 16 45 16 45C16 45 30 25.5 30 15C30 7.3 23.7 1 16 1Z';
  private readonly STAR_PATH = 'M16 8.3l1.9 4.2 4.4.4-3.4 3 1 4.4-3.9-2.4-3.9 2.4 1-4.4-3.4-3 4.4-.4z';

  // estActuel = le point où l'on en est dans le parcours (le plus proche pas
  // encore validé) — pas un état lié au clic sur le point, qui n'affecte que
  // la fiche du bas, pas la couleur du marqueur.
  private creerIcone(zone: JourneyZone, estActuel: boolean): L.DivIcon {
    if (this.badgeService.aBadge(zone.id)) {
      // Validé : le check remplace l'étoile, point phare ou non.
      const pinValideeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46"
          style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.3))">
        <path d="${this.PIN_PATH}" fill="#009245"/>
        <circle cx="16" cy="15" r="9.5" fill="#fff"/>
        <path d="M11.2 15.2l3.1 3.1 6.3-6.6" fill="none" stroke="#009245" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      return L.divIcon({
        className: '',
        html: pinValideeSvg,
        iconSize: [32, 46], iconAnchor: [16, 46]
      });
    }

    const couleur = estActuel ? '#D64B24' : '#6B6B6B';
    const etoile = POINTS_PHARES.has(zone.id)
      ? `<path d="${this.STAR_PATH}" fill="${estActuel ? '#FCEE21' : '#FCEEA3'}" stroke="${estActuel ? '#FCEEA3' : '#FCEEC2'}" stroke-width="0.6"/>`
      : '';

    const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46"
        style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.3))">
      <path d="${this.PIN_PATH}" fill="${couleur}"/>
      <circle cx="16" cy="15" r="8.4" fill="none" stroke="#D9D9D9" stroke-width="2.2"/>
      ${etoile}
    </svg>`;

    if (estActuel) {
      return L.divIcon({
        className: '',
        html: `<div style="position:relative;">
          <div style="position:absolute;width:46px;height:46px;border-radius:50%;top:-7px;left:-7px;
            border:2px solid rgba(214,75,36,0.4);animation:pulsation 1.8s ease-out infinite;pointer-events:none;"></div>
          ${pinSvg}
        </div>`,
        iconSize: [32, 46], iconAnchor: [16, 46]
      });
    }

    return L.divIcon({
      className: '',
      html: pinSvg,
      iconSize: [32, 46], iconAnchor: [16, 46]
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

  // ── Popups (infos au clic, hors itinéraire/badges — toujours affichés) ────

  iconeZone(zoneId: string): string {
    return this.pointsService.metaDe(zoneId)?.icone ?? '📍';
  }

  sousTitreZone(zoneId: string): string {
    const meta = this.pointsService.metaDe(zoneId);
    return this.pointsService.texte(meta?.sousTitre ?? '', meta?.sousTitreEn);
  }

  nomZone(zoneId: string): string {
    const meta = this.pointsService.metaDe(zoneId);
    return this.pointsService.texte(meta?.nom ?? '', meta?.nomEn);
  }

  private dessinerPopups(popups: PointPopup[]) {
    this.popupMarqueurs.forEach(m => m.remove());
    this.popupMarqueurs = popups.map(point =>
      L.marker(point.coords, { icon: this.creerMiniMarqueur(point), zIndexOffset: 200 })
        .addTo(this.map)
        .on('click', () => this.ngZone.run(() => {
          this.zoneSelectionneeId.set(null);
          this.miniPointSelectionne.set(point);
          this.mettreAJourPositionMiniPopup();
        }))
    );
  }

  // Projette le point sélectionné en pixels écran pour coller la bulle à son marqueur.
  private mettreAJourPositionMiniPopup() {
    const point = this.miniPointSelectionne();
    if (!point) { this.miniPopupPos.set(null); return; }
    const { x, y } = this.map.latLngToContainerPoint(point.coords as L.LatLngExpression);
    const marge = 90; // demi-largeur approx. de la bulle, pour éviter qu'elle sorte de l'écran
    const xBorne = Math.min(Math.max(x, marge), window.innerWidth - marge);
    this.miniPopupPos.set({ x: xBorne, y });
  }

  private creerMiniMarqueur(_point: PointPopup): L.DivIcon {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="22" height="22"
        style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.25));cursor:pointer;animation:miniAppear 0.35s cubic-bezier(0.34,1.56,0.64,1) both;">
      <circle cx="11" cy="11" r="10.25" fill="#009293" stroke="rgba(255,255,255,0.75)" stroke-width="1.5"/>
      <circle cx="11" cy="7" r="1.3" fill="#fff"/>
      <rect x="9.8" y="9.5" width="2.4" height="7" rx="1.2" fill="#fff"/>
    </svg>`;
    return L.divIcon({
      className: '',
      html: svg,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  fermerMiniPoint() {
    this.miniPointSelectionne.set(null);
    this.miniPopupPos.set(null);
  }

  toggleModeTransport() {
    this.modeTransport.set(this.modeTransport() === 'foot' ? 'driving' : 'foot');
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
    // En plus de recentrer, rapproche le zoom actuel de 50% (borné au maxZoom
    // de la carte) plutôt qu'un niveau fixe, pour "resserrer" quelle que soit
    // l'échelle à laquelle l'utilisateur regardait la carte.
    const zoomCible = Math.min(this.map.getZoom() * 1.5, this.map.getMaxZoom());

    // Cible le prochain point à valider (là où l'utilisateur doit se rendre),
    // pas sa position GPS — sauf s'il n'y a plus de point à faire (parcours
    // terminé), auquel cas on recentre sur lui.
    const prochain = this.prochaineZoneSansBadge();
    if (prochain) {
      this.map.flyTo(prochain.coords as L.LatLngExpression, zoomCible, { duration: 0.8 });
      return;
    }

    const pos = this.journeyService.positionUtilisateur();
    if (pos) {
      this.map.flyTo([pos.coords.latitude, pos.coords.longitude], zoomCible, { duration: 0.8 });
    } else {
      this.map.flyTo([-22.2660, 166.4083], zoomCible, { duration: 0.8 });
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
    const centre = this.map.getCenter();
    this.uiState.pointARouvrir.set({ pointId: zoneId, zoom: this.map.getZoom(), lat: centre.lat, lng: centre.lng });
    this.fermerFiche();
    this.router.navigate(['/tabs/parcours'], { queryParams: { zone: zoneId } });
  }

  fermerFiche() {
    this.zoneSelectionneeId.set(null);
    this.navCibleId.set(null);
  }

  toggleItineraire(zoneId: string) {
    const actif = this.navCibleId() === zoneId;
    const pos   = this.journeyService.positionUtilisateur();

    // La navigation live suit la position réelle : sans elle, impossible de
    // tracer un itinéraire "depuis ici". On prévient plutôt que de laisser
    // le bouton s'activer sans rien afficher.
    if (!actif && !pos) {
      this.journeyService.signalerPositionRequise();
      return;
    }

    this.navCibleId.set(actif ? null : zoneId);
    if (!actif) {
      this.zoneSelectionneeId.set(null);
      const zone = this.journeyService.zones().find(z => z.id === zoneId);
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

  async recommencer() {
    this.zoneSelectionneeId.set(null);
    this.arriveeDejaTraitee.clear();
    this.zoneArrivee.set(null);
    this.miniPointSelectionne.set(null);
    this.miniPopupPos.set(null);
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
