import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { SupabaseService } from './supabase';
import { Site, Contenu, Jeu } from '../models/kaval.models';

export interface DownloadProgress {
  total: number;
  current: number;
  pourcentage: number;
  fichierEnCours: string;
}

export interface Pack {
  site: Site;
  contenus: Contenu[];
  jeux: Jeu[];
}

@Injectable({ providedIn: 'root' })
export class DownloadManagerService {

  private progressCallback?: (progress: DownloadProgress) => void;

  constructor(private supabaseService: SupabaseService) {}

  // Vérifie si le réseau est disponible
  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  // Télécharge le pack complet d'un site
  async downloadPack(siteId: string, onProgress?: (progress: DownloadProgress) => void): Promise<void> {
    this.progressCallback = onProgress;

    const online = await this.isOnline();
    if (!online) {
      throw new Error('Pas de connexion réseau. Connecte-toi en Wi-Fi pour télécharger.');
    }

    // Récupère les données du site depuis Supabase
    const pack = await this.fetchPackData(siteId);

    // Calcule le nombre total de fichiers à télécharger
    const fichiers = this.extractFichiers(pack);
    const total = fichiers.length;
    let current = 0;

    // Télécharge chaque fichier
    for (const fichier of fichiers) {
      if (fichier.url) {
        this.notifyProgress({ total, current, pourcentage: Math.round((current / total) * 100), fichierEnCours: fichier.nom });
        await this.downloadFichier(fichier.url, fichier.chemin);
        current++;
      }
    }

    // Sauvegarde le JSON du pack en local
    await this.savePackMetadata(siteId, pack);

    this.notifyProgress({ total, current: total, pourcentage: 100, fichierEnCours: 'Terminé' });
  }

  // Récupère les données depuis Supabase
  private async fetchPackData(siteId: string): Promise<Pack> {
    const client = this.supabaseService.client;

    const { data: site, error: siteError } = await client
      .from('sites')
      .select('*')
      .eq('identifiant', siteId)
      .single();
    if (siteError) throw siteError;

    const { data: contenus, error: contenusError } = await client
      .from('contenus')
      .select('*')
      .eq('site_id', siteId);
    if (contenusError) throw contenusError;

    const { data: jeux, error: jeuxError } = await client
      .from('jeu')
      .select('*')
      .eq('site_id', siteId);
    if (jeuxError) throw jeuxError;

    return { site, contenus: contenus || [], jeux: jeux || [] };
  }

  // Extrait la liste des URLs à télécharger
  private extractFichiers(pack: Pack): { nom: string; url: string; chemin: string }[] {
    const fichiers: { nom: string; url: string; chemin: string }[] = [];

    for (const contenu of pack.contenus) {
      if (contenu.audio) {
        fichiers.push({ nom: contenu.titre + ' (audio)', url: contenu.audio, chemin: `kaval/audio/${contenu.identifiant}.mp3` });
      }
      if (contenu.video) {
        fichiers.push({ nom: contenu.titre + ' (vidéo)', url: contenu.video, chemin: `kaval/video/${contenu.identifiant}.mp4` });
      }
      if (contenu.img) {
        fichiers.push({ nom: contenu.titre + ' (image)', url: contenu.img, chemin: `kaval/images/${contenu.identifiant}.jpg` });
      }
    }

    for (const jeu of pack.jeux) {
      if (jeu.path_dossier) {
        fichiers.push({ nom: jeu.titre + ' (jeu)', url: jeu.path_dossier, chemin: `kaval/jeux/${jeu.identifiant}.zip` });
      }
    }

    return fichiers;
  }

  // Télécharge un fichier et le sauvegarde localement
  private async downloadFichier(url: string, chemin: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur téléchargement : ${url}`);

    const blob = await response.blob();
    const base64 = await this.blobToBase64(blob);

    await Filesystem.writeFile({
      path: chemin,
      data: base64,
      directory: Directory.Data,
      recursive: true
    });
  }

  // Sauvegarde les métadonnées du pack en JSON local
  private async savePackMetadata(siteId: string, pack: Pack): Promise<void> {
    await Filesystem.writeFile({
      path: `kaval/packs/${siteId}.json`,
      data: JSON.stringify(pack),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true
    });
  }

  // Charge un pack depuis le stockage local
  async loadPackLocal(siteId: string): Promise<Pack | null> {
    try {
      const result = await Filesystem.readFile({
        path: `kaval/packs/${siteId}.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      return JSON.parse(result.data as string);
    } catch {
      return null;
    }
  }

  // Vérifie si un pack est déjà téléchargé
  async isPackDownloaded(siteId: string): Promise<boolean> {
    const pack = await this.loadPackLocal(siteId);
    return pack !== null;
  }

  // Convertit un Blob en base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private notifyProgress(progress: DownloadProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}