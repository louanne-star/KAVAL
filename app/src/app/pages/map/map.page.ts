import { Component, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MapPage implements AfterViewInit {

  private map!: L.Map;
  zoneSelectionnee: any = null;

  private zones = [
    { id: 'zone1_camp_est', ordre: 1, nom: 'Le Camp Est', description: 'Annexe du pénitencier avec activités industrielles et bâtiments cellulaires.', coords: [-22.2710, 166.4260] as [number, number], debloque: false },
    { id: 'zone2_vacherie', ordre: 2, nom: 'La Vacherie', description: 'Zone agricole regroupant le camp des libérés et le cimetière des surveillants.', coords: [-22.2669, 166.4130] as [number, number], debloque: false },
    { id: 'zone3_hopital', ordre: 3, nom: "L'Hôpital du Marais", description: 'Ancienne zone hospitalière avec chapelle, lavoir, briqueterie et cimetière.', coords: [-22.2667, 166.3975] as [number, number], debloque: false },
    { id: 'zone4_penitencier', ordre: 4, nom: 'Le Pénitencier', description: 'Cœur historique de l\'Île Nou. Musée du bagne et parcours archéologique.', coords: [-22.2617, 166.4033] as [number, number], debloque: true },
    { id: 'zone5_kuendu', ordre: 5, nom: 'La Ferme Nord', description: 'Zone dédiée à l\'agriculture et à l\'isolement sanitaire. Phare et léproserie.', coords: [-22.2606, 166.3909] as [number, number], debloque: false },
  ];

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 200);
  }

  private initMap() {
    this.map = L.map('map-container', {
      center: [-22.2660, 166.4083],
      zoom: 13,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19
    }).addTo(this.map);

    this.ajouterMarqueurs();
  }

  private ajouterMarqueurs() {
    this.zones.forEach(zone => {
      const couleur = zone.debloque ? '#c9a84c' : '#1b3a2a';
      const bordure = zone.debloque ? '#8b6914' : '#4a6b55';
      const couleurTexte = zone.debloque ? '#1b3a2a' : '#ffffff';

      const icone = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            width:42px;height:42px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            background:${zone.debloque ? '#c9a84c' : '#ffffff'};
            border:3px solid ${zone.debloque ? '#8b6914' : '#ddd'};
            box-shadow:0 4px 16px rgba(0,0,0,0.2);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="
              transform:rotate(45deg);
              font-size:15px;font-weight:800;
              color:${zone.debloque ? '#1a2e1e' : '#aaa'};
            ">${zone.ordre}</span>
          </div>
        </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 42]
      });

      L.marker(zone.coords, { icon: icone })
        .addTo(this.map)
        .on('click', () => {
          this.zoneSelectionnee = zone;
          this.map.flyTo(zone.coords, 15, { duration: 0.8 });
        });
    });
  }

  recentrer() {
  this.map.flyTo([-22.2660, 166.4083], 13, { duration: 0.8 });
  }

  fermerFiche() {
    this.zoneSelectionnee = null;
  }
}