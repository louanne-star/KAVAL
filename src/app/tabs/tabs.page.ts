import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, listOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, CommonModule]
})
export class TabsPage {

  ongletActif = signal<string>('carte');

  readonly onglets = [
    { id: 'carte',    icone: 'map-outline',                label: 'Carte'    },
    { id: 'parcours', icone: 'list-outline',               label: 'Parcours' },
    { id: 'apropos',  icone: 'information-circle-outline', label: 'À propos' },
  ];

  constructor(private router: Router) {
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
