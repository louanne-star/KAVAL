// Page mentions légales et politique de confidentialité, accessible même sans compte.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

addIcons({ chevronBackOutline });

@Component({
  selector: 'app-mentions-legales',
  templateUrl: './mentions-legales.page.html',
  styleUrls: ['./mentions-legales.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class MentionsLegalesPage {
  constructor(private router: Router) {}

  retour() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
