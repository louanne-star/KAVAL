import { Injectable, signal } from '@angular/core';

// Capture l'évènement "beforeinstallprompt" de Chrome/Edge pour déclencher
// l'install sur demande (bouton dans le tuto), vu que Chrome ne montre plus
// de bandeau automatique. N'existe pas sur Safari iOS.
@Injectable({ providedIn: 'root' })
export class InstallService {

  readonly peutInstaller = signal(false);

  private evenement: Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> } | null = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.evenement = e as any;
      this.peutInstaller.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.evenement = null;
      this.peutInstaller.set(false);
    });
  }

  async installer(): Promise<void> {
    if (!this.evenement) return;
    await this.evenement.prompt();
    await this.evenement.userChoice;
    this.evenement = null;
    this.peutInstaller.set(false);
  }
}
