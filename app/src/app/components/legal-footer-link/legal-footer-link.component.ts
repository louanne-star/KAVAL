// Petit lien vers les mentions légales, repris en bas de plusieurs pages.
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-footer-link',
  template: `
    <a class="legal-footer-link" routerLink="/mentions-legales">
      {{ 'commun.mentionsLegales' | translate }}
    </a>
  `,
  styles: [`
    .legal-footer-link {
      display: block;
      text-align: center;
      font-size: 12.5px;
      color: var(--ion-color-medium, #888);
      text-decoration: underline;
      padding: 18px 16px 10px;
      opacity: 0.8;
    }
  `],
  standalone: true,
  imports: [RouterLink, TranslatePipe],
})
export class LegalFooterLinkComponent {}
