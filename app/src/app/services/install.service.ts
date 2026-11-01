import { Injectable, signal } from '@angular/core';

// Chrome/Edge sur Android ne montrent plus de bandeau d'installation
// automatique : il capture l'évènement "beforeinstallprompt" et le déclenche
// seulement sur demande (bouton "Installer l'app" dans le tuto). Sur Safari
// iOS, cet évènement n'existe pas (voir le bloc d'instructions dédié dans
// onboarding.page.ts).
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
