import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, listOutline, informationCircleOutline } from 'ionicons/icons';
import { UiStateService } from '../services/ui-state.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, CommonModule]
})
export class TabsPage {

  ongletActif = signal<string>('carte');

  // Pas d'entrée "Parcours" : cette page n'a plus de vue autonome (l'ancienne
  // liste "Mon Épopée" a été supprimée), elle ne s'ouvre que sur un point
  // précis depuis la Carte, Recherche ou Compte.
  readonly onglets = [
    { id: 'carte',    icone: 'map-outline',                label: 'Carte'    },
    { id: 'apropos',  icone: 'information-circle-outline', label: 'À propos' },
  ];

  constructor(private router: Router, readonly uiState: UiStateService) {
    addIcons({ mapOutline, listOutline, informationCircleOutline });

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
