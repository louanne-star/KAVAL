import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, listOutline, informationCircleOutline } from 'ionicons/icons';
import { TranslateService } from '@ngx-translate/core';
import { UiStateService } from '../services/ui-state.service';
import { JourneyService } from '../services/journey.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, CommonModule]
})
export class TabsPage {

  ongletActif = signal<string>('carte');

  readonly onglets = computed(() => {
    this.languageService.langue(); // recalcule les labels quand la langue change
    return [
      { id: 'carte',    icone: 'map-outline',                label: this.translate.instant('tabs.carte')    },
      { id: 'parcours', icone: 'list-outline',               label: this.translate.instant('tabs.parcours') },
      { id: 'apropos',  icone: 'information-circle-outline', label: this.translate.instant('tabs.apropos')  },
    ];
  });

  constructor(
    private router: Router,
    private translate: TranslateService,
    readonly uiState: UiStateService,
    readonly languageService: LanguageService,
    journeyService: JourneyService,
  ) {
    addIcons({ mapOutline, listOutline, informationCircleOutline });

    // Ici plutôt que dans MapPage : TabsPage est le parent commun des onglets
    // (carte/parcours/apropos) et n'est instancié qu'une fois par session,
    // donc le parcours se charge même si on atterrit/recharge directement
    // sur /tabs/parcours sans jamais passer par la carte.
    journeyService.initialiser();

    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects ?? '';
        if      (url.includes('/parcours')) this.ongletActif.set('parcours');
        else if (url.includes('/apropos'))  this.ongletActif.set('apropos');
        else                                this.ongletActif.set('carte');
      });
  }

  navTo(tab: string) {
    this.router.navigate([`/tabs/${tab}`]);
  }
}
