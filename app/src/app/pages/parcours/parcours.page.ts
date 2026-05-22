import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-parcours',
  templateUrl: './parcours.page.html',
  styleUrls: ['./parcours.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ParcoursPage {

  zonesVisitees = 1;

  zones = [
    {
      ordre: 1,
      nom: 'Le Camp Est',
      sousTitre: 'Carrière & industrie',
      iconeVisite: '⛏️',
      iconeLocked: '⛏️',
      statut: 'visite'
    },
    {
      ordre: 2,
      nom: 'La Vacherie',
      sousTitre: 'Agriculture & libérés',
      iconeVisite: '🌾',
      iconeLocked: '🌾',
      statut: 'actif'
    },
    {
      ordre: 3,
      nom: "L'Hôpital du Marais",
      sousTitre: 'Soins & chapelle',
      iconeVisite: '✝️',
      iconeLocked: '✝️',
      statut: 'locked'
    },
    {
      ordre: 4,
      nom: 'Le Pénitencier',
      sousTitre: 'Cœur du bagne',
      iconeVisite: '🗝️',
      iconeLocked: '🔒',
      statut: 'locked'
    },
    {
      ordre: 5,
      nom: 'La Ferme Nord',
      sousTitre: 'Phare & léproserie',
      iconeVisite: '🌊',
      iconeLocked: '🌊',
      statut: 'locked'
    }
  ];
}