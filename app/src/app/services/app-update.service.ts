import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

// Le service worker se met à jour tout seul en arrière-plan ; sans ça,
// l'utilisateur reste sur une vieille version jusqu'au prochain rechargement
// complet, sans le savoir. On affiche donc un bandeau explicite dès qu'une
// nouvelle version est prête, plutôt qu'un rechargement silencieux. Utilisé
// par app.component.ts pour afficher ce bandeau.
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
