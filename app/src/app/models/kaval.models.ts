export interface Site {
  identifiant: string;
  nom: string;
  gps_lat: number;
  gps_lng: number;
  categorie: string;
  image_ext: string;
  poids_total: number;
}

export interface Contenu {
  identifiant: string;
  site_id: string;
  type: 'audio' | 'video' | 'texte';
  titre: string;
  img: string;
  video: string;
  audio: string;
  description: string;
}

export interface Jeu {
  identifiant: string;
  site_id: string;
  type: 'phaser' | 'quiz';
  titre: string;
  consigne: string;
  path_dossier: string;
  solution: string;
  gain_id: string;
}

export interface Inventaire {
  identifiant: string;
  nom: string;
  image_svg: string;
  rarete: 'commun' | 'rare' | 'legendaire';
}

export interface Utilisateur {
  utilisateur_id: string;
  dernier_lat: number;
  dernier_lng: number;
}

export interface UtilisateurVisite {
  utilisateur_id: string;
  site_id: string;
}

export interface UtilisateurInventaire {
  utilisateur_id: string;
  inventaire_id: string;
}