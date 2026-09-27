import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LanguageService } from './services/language.service';
import { TutorialOverlayComponent } from './components/tutorial-overlay/tutorial-overlay.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, TutorialOverlayComponent],
})
export class AppComponent {
  constructor(private languageService: LanguageService) {}
}
