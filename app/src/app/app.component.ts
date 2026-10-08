import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { BrandingService } from './services/branding.service';
import { TutorialOverlayComponent } from './components/tutorial-overlay/tutorial-overlay.component';
import { SyncService } from './services/sync.service';

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
  ) {}
}
