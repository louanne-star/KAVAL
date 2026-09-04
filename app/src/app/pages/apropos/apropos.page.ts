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

  vestiges: { nom: string; icone: string; couleur: string; image?: string }[] = [
    { nom: 'La Boulangerie', icone: 'flame-outline', couleur: '#2d1a0a' },
    { nom: 'Magasin des vivres', icone: 'storefront-outline', couleur: '#0a1a2d' },
    { nom: 'Les Ateliers', icone: 'hammer-outline', couleur: '#1a2e1e' },
    { nom: 'Caserne des surveillants', icone: 'home-outline', couleur: '#1a1a2d' },
    { nom: 'Chapelle Saint-Thomas', icone: 'prism-outline', couleur: '#2d1a2d' },
  ];

  vestigeIndex = 0;
  vestigeSelectionne: { nom: string; icone: string; couleur: string; image?: string } | null = null;

  chiffres = [
    { valeur: '1864', label: 'Année d\'ouverture' },
    { valeur: '1897', label: 'Fin de la transportation' },
    { valeur: '22 000', label: 'Forçats transportés' },
    { valeur: '33 ans', label: 'Durée du bagne' },
    { valeur: '5', label: 'Zones historiques' },
    { valeur: '25', label: 'Lieux recensés' },
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
      texte: "Créé en 1864 à la pointe de Nouville, le pénitencier-dépôt de l'Île Nou fut le point d'entrée de la transportation pénale française en Nouvelle-Calédonie : c'est là qu'arrivaient les condamnés, avant d'être répartis vers les camps de l'île ou de la Grande Terre (Bourail, Canala, la vallée du Diahot...). Jusqu'à la fin de la transportation en 1897, environ 22 000 forçats furent envoyés dans la colonie. Les conditions de vie y étaient très dures : le taux de mortalité annuel a atteint environ 27 pour 1 000 entre 1877 et 1883. Les principaux bâtiments du site ont été classés monuments historiques en 1977, et le site a rouvert au public en 2021 grâce au travail de préservation de l'association ATUP (Témoignage d'un Passé)."
    },
    vestiges: {
      titre: 'Les Vestiges',
      texte: "Une partie des bâtiments d'origine est aujourd'hui classée monument historique et se visite : l'ancienne boulangerie pénitentiaire (qui abrite désormais une exposition), le bâtiment cellulaire de l'hôpital, l'hôtel du commandant, le presbytère et la chapelle Saint-Thomas. D'autres constructions, notamment celles du Camp Est et de la Vacherie, ont aujourd'hui disparu et ne subsistent que sur d'anciennes photographies. Le site est entretenu par l'association ATUP (Témoignage d'un Passé), qui organise aussi des visites guidées et des ateliers pédagogiques."
    },
  };

  ouvrirPopup(id: 'histoire' | 'vestiges') {
    this.popupOuvert = id;
  }

  fermerPopup() {
    this.popupOuvert = null;
  }

  onVestigesScroll(e: Event) {
    const el = e.target as HTMLElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    this.vestigeIndex = maxScroll <= 0
      ? 0
      : Math.round((el.scrollLeft / maxScroll) * (this.vestiges.length - 1));
  }

  ouvrirVestige(v: { nom: string; icone: string; couleur: string; image?: string }) {
    this.vestigeSelectionne = v;
  }

  fermerVestige() {
    this.vestigeSelectionne = null;
  }
}