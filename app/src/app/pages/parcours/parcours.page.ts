import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { JourneyService, JourneyZone } from '../../services/journey.service';

@Component({
  selector: 'app-parcours',
  templateUrl: './parcours.page.html',
  styleUrls: ['./parcours.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons]
})
export class ParcoursPage implements OnInit, OnDestroy {

  zoneSelectionnee: JourneyZone | null = null;
  private paramSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    readonly journeyService: JourneyService
  ) {}

  ngOnInit() {
    // queryParamMap est un Observable : il se redéclenche à chaque navigation
    // vers cet onglet, même si le composant est déjà en mémoire (tabs Ionic)
    this.paramSub = this.route.queryParamMap.subscribe(params => {
      const zoneId = params.get('zone');
      this.zoneSelectionnee = zoneId
        ? (this.journeyService.zones().find(z => z.id === zoneId) ?? null)
        : null;
    });
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
  }

  retourCarte() {
    this.router.navigate(['/tabs/carte']);
  }

  get zonesDebloquees(): JourneyZone[] {
    return this.journeyService.zones().filter(z => z.debloque);
  }

  ouvrirZone(zone: JourneyZone) {
    this.zoneSelectionnee = zone;
  }
}
