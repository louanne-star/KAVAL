// Composant racine de l'app : démarre les services globaux (langue,
// branding, synchro, connexion réseau, mises à jour) et affiche la zone de
// routage plus le tutoriel par-dessus. Tout le reste de l'app (splash,
// onboarding, tabs...) s'affiche à l'intérieur via le routeur Angular.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { BrandingService } from './services/branding.service';
import { TutorialOverlayComponent } from './components/tutorial-overlay/tutorial-overlay.component';
import { SyncService } from './services/sync.service';
import { ConnectivityService } from './services/connectivity.service';
import { AppUpdateService } from './services/app-update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [CommonModule, IonApp, IonRouterOutlet, TutorialOverlayComponent, TranslatePipe],
})
export class AppComponent {
  constructor(
    private languageService: LanguageService,
    private brandingService: BrandingService,
    readonly sync: SyncService,
    readonly connectivity: ConnectivityService,
    readonly appUpdate: AppUpdateService,
  ) {}
}
