import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { hammerOutline, flameOutline, storefrontOutline, homeOutline, prismOutline, leafOutline } from 'ionicons/icons';

@Component({
  selector: 'app-apropos',
  templateUrl: './apropos.page.html',
  styleUrls: ['./apropos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AproposPage {

  constructor() {
    addIcons({ hammerOutline, flameOutline, storefrontOutline, homeOutline, prismOutline, leafOutline });
  }

  vestiges = [
    { nom: 'La grande cheminée', icone: 'flame-outline', couleur: '#2d1a0a' },
    { nom: 'Magasin colonial', icone: 'storefront-outline', couleur: '#0a1a2d' },
    { nom: 'Atelier des forçats', icone: 'hammer-outline', couleur: '#1a2e1e' },
    { nom: 'Caserne', icone: 'home-outline', couleur: '#1a1a2d' },
    { nom: 'Chapelle', icone: 'prism-outline', couleur: '#2d1a2d' },
  ];

  chiffres = [
    { valeur: '1864', label: 'Année d\'ouverture' },
    { valeur: '1897', label: 'Année de fermeture' },
    { valeur: '22 000', label: 'Forçats déportés' },
    { valeur: '33 ans', label: 'Durée du bagne' },
    { valeur: '5', label: 'Zones historiques' },
    { valeur: '38', label: 'Lieux recensés' },
  ];

  credits = [
    { role: 'Développement & Design', nom: 'Ondine Taukolo' },
    { role: 'Développement Front', nom: 'Louanne Grosjean' },
    { role: 'Encadrement', nom: 'Université de la Nouvelle-Calédonie' },
    { role: 'Sources historiques', nom: 'Archives de Nouvelle-Calédonie' },
  ];
}