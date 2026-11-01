import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

// Affiche un bandeau quand une nouvelle version du service worker est prête,
// plutôt qu'un rechargement silencieux qui surprendrait l'utilisateur.
@Injectable({ providedIn: 'root' })
export class AppUpdateService {

  readonly misAJourDisponible = signal(false);

  constructor(private swUpdate: SwUpdate) {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.misAJourDisponible.set(true));
  }

  recharger(): void {
    document.location.reload();
  }
}
