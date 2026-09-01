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
    { role: 'Équipe Développement web', nom: 'Ondine Taukolo & Lou-Anne Grosjean' },
    { role: 'Équipe Stratégie & UX', nom: 'Marie-Loane Diemene, Graig Moury & Anaelle Watanabe' },
    { role: 'Encadrement', nom: 'Université de la Nouvelle-Calédonie' },
    { role: 'Sources historiques', nom: 'Association Témoignage d\'Un Passé' },
  ];

  popupOuvert: 'histoire' | 'vestiges' | null = null;

  readonly popups = {
    histoire: {
      titre: "L'Histoire du bagne",
      texte: "Créé en 1864, le bagne de l'Île Nou fut le point d'entrée de la transportation pénale française en Nouvelle-Calédonie. Jusqu'à sa fermeture en 1897, environ 22 000 forçats y furent déportés et condamnés aux travaux forcés dans des conditions très dures : carrières, briqueterie, agriculture, construction. L'administration pénitentiaire organisait la vie du bagne en plusieurs zones spécialisées — industrielle, agricole, hospitalière — dont on retrouve aujourd'hui les vestiges disséminés sur l'île."
    },
    vestiges: {
      titre: 'Les Vestiges',
      texte: "Plus d'un siècle plus tard, les traces du bagne subsistent par fragments : fondations de bâtiments, fours, ateliers et lieux de culte témoignent encore de la vie quotidienne des forçats. La grande cheminée, le magasin colonial, l'atelier des forçats, la caserne militaire ou la chapelle font partie des vestiges les plus visibles aujourd'hui, intégrés au paysage urbain de Nouméa."
    },
  };

  ouvrirPopup(id: 'histoire' | 'vestiges') {
    this.popupOuvert = id;
  }

  fermerPopup() {
    this.popupOuvert = null;
  }
}