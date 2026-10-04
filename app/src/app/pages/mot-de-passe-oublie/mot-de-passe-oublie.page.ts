import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mot-de-passe-oublie',
  templateUrl: './mot-de-passe-oublie.page.html',
  styleUrls: ['./mot-de-passe-oublie.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe, RouterLink]
})
export class MotDePasseOubliePage {

  email      = '';
  chargement = signal(false);
  erreur     = signal<string | null>(null);
  envoye     = signal(false);

  private readonly REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private auth: AuthService,
    private translate: TranslateService,
  ) {}

  async soumettre() {
    this.email = this.email.trim().toLowerCase();

    if (!this.REGEX_EMAIL.test(this.email)) {
      this.erreur.set(this.translate.instant('auth.erreurs.emailInvalide'));
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    try {
      await this.auth.demanderReinitialisation(this.email);
    } catch (err: any) {
      // On ne confirme jamais si l'adresse existe ou non : seules les erreurs
      // de format/limite de requêtes sont affichées, jamais "compte introuvable".
      console.error('[MotDePasseOublie] Erreur Supabase :', err);
      const msg = String(err?.message ?? '');
      this.chargement.set(false);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        this.erreur.set(this.translate.instant('auth.erreurs.horsLigne'));
      } else if (msg.toLowerCase().includes('security purposes') || msg.includes('rate limit')) {
        this.erreur.set(this.translate.instant('auth.erreurs.tropDeDemandes'));
      } else {
        this.erreur.set(this.translate.instant('auth.erreurs.generique'));
      }
      return;
    }

    this.chargement.set(false);
    this.envoye.set(true);
  }
}
