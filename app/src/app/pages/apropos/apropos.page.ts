import { Component, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { hammerOutline, flameOutline, storefrontOutline, homeOutline, prismOutline, leafOutline } from 'ionicons/icons';
import { LanguageService } from '../../services/language.service';

type Vestige = { nom: string; icone: string; couleur: string; image?: string };

const CONTENU = {
  fr: {
    hero: { label: 'ÎLE NOU', titreLigne1: 'BAGNE DE', titreLigne2: 'NOUVELLE-CALÉDONIE', tagline: 'Explorer. Comprendre. Se souvenir.' },
    histoire: {
      titre: "L'HISTOIRE",
      texte: "De 1864 à 1897, l'Île Nou fut l'un des principaux bagnes de Nouvelle-Calédonie. Des milliers de forçats y vécurent et travaillèrent dans des conditions extrêmes.",
    },
    vestigesTitre: 'LES VESTIGES',
    vestiges: [
      { nom: 'La Boulangerie', icone: 'flame-outline', couleur: '#2d1a0a' },
      { nom: 'Magasin des vivres', icone: 'storefront-outline', couleur: '#0a1a2d' },
      { nom: 'Les Ateliers', icone: 'hammer-outline', couleur: '#1a2e1e' },
      { nom: 'Caserne des surveillants', icone: 'home-outline', couleur: '#1a1a2d' },
      { nom: 'Chapelle Saint-Thomas', icone: 'prism-outline', couleur: '#2d1a2d' },
    ] as Vestige[],
    artisanat: {
      titre: "L'ARTISANAT",
      texte: "Les forçats de l'Île Nou étaient aussi de talentueux artisans. Leurs gravures sur nacre témoignent d'un savoir-faire unique, né de la contrainte et de la volonté de créer malgré l'adversité.",
    },
    projet: {
      titre: 'LE PROJET KAVAL',
      texte: "KAVAL est né d'une SAE (Situation d'Apprentissage et d'Évaluation) du BUT Métiers du Multimédia et de l'Internet (MMI) de l'Université de la Nouvelle-Calédonie. Conçue par une équipe d'étudiants passionnés d'histoire et de patrimoine calédonien, l'application a pour mission de faire découvrir le bagne de l'Île Nou au plus grand nombre.",
    },
    chiffresTitre: 'CHIFFRES CLÉS',
    chiffres: [
      { valeur: '1864', label: "Année d'ouverture" },
      { valeur: '1897', label: 'Fin de la transportation' },
      { valeur: '22 000', label: 'Forçats transportés' },
      { valeur: '33 ans', label: 'Durée du bagne' },
      { valeur: '5', label: 'Zones historiques' },
      { valeur: '25', label: 'Lieux recensés' },
    ],
    creditsTitre: 'CRÉDITS & REMERCIEMENTS',
    credits: [
      { role: 'Équipe Développement web', nom: 'Ondine Taukolo & Lou-Anne Grosjean' },
      { role: 'Équipe Stratégie & UX', nom: 'Marie-Loane Diemene, Graig Moury & Anaelle Watanabe' },
      { role: 'Encadrement', nom: 'Université de la Nouvelle-Calédonie' },
      { role: 'Sources historiques', nom: "Association Témoignage d'Un Passé" },
    ],
    enSavoirPlus: 'En savoir plus',
    popups: {
      histoire: {
        titre: 'Histoire du bagne',
        texte: "Créé en 1864 à la pointe de Nouville, le pénitencier-dépôt de l'Île Nou fut le point d'entrée de la transportation pénale française en Nouvelle-Calédonie : c'est là qu'arrivaient les condamnés, avant d'être répartis vers les camps de l'île ou de la Grande Terre (Bourail, Canala, la vallée du Diahot...). Jusqu'à la fin de la transportation en 1897, environ 22 000 forçats furent envoyés dans la colonie. Les conditions de vie y étaient très dures : le taux de mortalité annuel a atteint environ 27 pour 1 000 entre 1877 et 1883. Les principaux bâtiments du site ont été classés monuments historiques en 1977, et le site a rouvert au public en 2021 grâce au travail de préservation de l'association ATUP (Témoignage d'un Passé).",
      },
      vestiges: {
        titre: 'Les Vestiges',
        texte: "Une partie des bâtiments d'origine est aujourd'hui classée monument historique et se visite : l'ancienne boulangerie pénitentiaire (qui abrite désormais une exposition), le bâtiment cellulaire de l'hôpital, l'hôtel du commandant, le presbytère et la chapelle Saint-Thomas. D'autres constructions, notamment celles du Camp Est et de la Vacherie, ont aujourd'hui disparu et ne subsistent que sur d'anciennes photographies. Le site est entretenu par l'association ATUP (Témoignage d'un Passé), qui organise aussi des visites guidées et des ateliers pédagogiques.",
      },
    },
  },
  en: {
    hero: { label: 'NOU ISLAND', titreLigne1: 'NEW CALEDONIA', titreLigne2: 'PENAL COLONY', tagline: 'Explore. Understand. Remember.' },
    histoire: {
      titre: 'HISTORY',
      texte: "From 1864 to 1897, Nou Island was one of the main penal colonies in New Caledonia. Thousands of convicts lived and worked there in extreme conditions.",
    },
    vestigesTitre: 'THE REMAINS',
    vestiges: [
      { nom: 'The Bakery', icone: 'flame-outline', couleur: '#2d1a0a' },
      { nom: 'Provisions Store', icone: 'storefront-outline', couleur: '#0a1a2d' },
      { nom: 'The Workshops', icone: 'hammer-outline', couleur: '#1a2e1e' },
      { nom: 'Guards’ Barracks', icone: 'home-outline', couleur: '#1a1a2d' },
      { nom: 'Saint-Thomas Chapel', icone: 'prism-outline', couleur: '#2d1a2d' },
    ] as Vestige[],
    artisanat: {
      titre: 'CRAFTSMANSHIP',
      texte: "The convicts of Nou Island were also talented craftsmen. Their mother-of-pearl engravings bear witness to a unique skill, born of constraint and the will to create despite adversity.",
    },
    projet: {
      titre: 'THE KAVAL PROJECT',
      texte: "KAVAL was born from a capstone project of the Multimedia and Internet Professions degree (BUT MMI) at the University of New Caledonia. Designed by a team of students passionate about Caledonian history and heritage, the app's mission is to introduce the Nou Island penal colony to as many people as possible.",
    },
    chiffresTitre: 'KEY FIGURES',
    chiffres: [
      { valeur: '1864', label: 'Opening year' },
      { valeur: '1897', label: 'End of transportation' },
      { valeur: '22,000', label: 'Convicts transported' },
      { valeur: '33 years', label: 'Duration of the penal colony' },
      { valeur: '5', label: 'Historical zones' },
      { valeur: '25', label: 'Sites recorded' },
    ],
    creditsTitre: 'CREDITS & ACKNOWLEDGEMENTS',
    credits: [
      { role: 'Web Development Team', nom: 'Ondine Taukolo & Lou-Anne Grosjean' },
      { role: 'Strategy & UX Team', nom: 'Marie-Loane Diemene, Graig Moury & Anaelle Watanabe' },
      { role: 'Supervision', nom: 'University of New Caledonia' },
      { role: 'Historical sources', nom: "Association Témoignage d'Un Passé" },
    ],
    enSavoirPlus: 'Learn more',
    popups: {
      histoire: {
        titre: 'History of the penal colony',
        texte: "Founded in 1864 at the Nouville headland, the Île Nou penitentiary depot was the entry point for French penal transportation to New Caledonia: this is where convicts arrived before being dispatched to camps on the island or on the mainland (Bourail, Canala, the Diahot valley...). By the end of transportation in 1897, about 22,000 convicts had been sent to the colony. Living conditions were extremely harsh: the annual mortality rate reached about 27 per 1,000 between 1877 and 1883. The site's main buildings were listed as historical monuments in 1977, and the site reopened to the public in 2021 thanks to the preservation work of the ATUP association (Témoignage d'un Passé).",
      },
      vestiges: {
        titre: 'The Remains',
        texte: "Some of the original buildings are now listed historical monuments open to visitors: the former penitentiary bakery (now housing an exhibition), the hospital's cell block, the commandant's residence, the presbytery and the Saint-Thomas chapel. Other structures, notably those of Camp Est and La Vacherie, have since disappeared and survive only in old photographs. The site is maintained by the ATUP association (Témoignage d'un Passé), which also organizes guided tours and educational workshops.",
      },
    },
  },
};

@Component({
  selector: 'app-apropos',
  templateUrl: './apropos.page.html',
  styleUrls: ['./apropos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AproposPage {

  readonly contenu = computed(() => CONTENU[this.languageService.langue()]);

  constructor(private languageService: LanguageService) {
    addIcons({ hammerOutline, flameOutline, storefrontOutline, homeOutline, prismOutline, leafOutline });
  }

  popupOuvert: 'histoire' | 'vestiges' | null = null;
  vestigeIndex = 0;
  vestigeSelectionne: Vestige | null = null;

  ouvrirPopup(id: 'histoire' | 'vestiges') {
    this.popupOuvert = id;
  }

  fermerPopup() {
    this.popupOuvert = null;
  }

  onVestigesScroll(e: Event) {
    const el = e.target as HTMLElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const total = this.contenu().vestiges.length;
    this.vestigeIndex = maxScroll <= 0
      ? 0
      : Math.round((el.scrollLeft / maxScroll) * (total - 1));
  }

  ouvrirVestige(v: Vestige) {
    this.vestigeSelectionne = v;
  }

  fermerVestige() {
    this.vestigeSelectionne = null;
  }
}
