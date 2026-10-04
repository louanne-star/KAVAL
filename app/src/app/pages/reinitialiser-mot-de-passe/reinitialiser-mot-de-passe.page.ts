import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { REGEX_MDP } from '../../shared/password-policy';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  templateUrl: './reinitialiser-mot-de-passe.page.html',
  styleUrls: ['./reinitialiser-mot-de-passe.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe, RouterLink]
})
export class ReinitialiserMotDePassePage implements OnInit {

  // 'verification' : on confirme que le lien est valide avant d'afficher quoi que ce soit
  // 'formulaire'   : lien valide, on peut saisir le nouveau mot de passe
  // 'invalide'     : lien expiré, déjà utilisé, ou page ouverte sans lien
  // 'succes'       : mot de passe mis à jour
  etat = signal<'verification' | 'formulaire' | 'invalide' | 'succes'>('verification');

  nouveauMdp = '';
  confirmMdp = '';
  chargement = signal(false);
  erreur     = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    // Le lien Supabase établit la session de récupération dès le chargement de la
    // page (détection automatique du jeton dans le fragment d'URL). On vérifie que
    // cette session existe avant d'afficher le formulaire, plutôt que de se fier au
    // timing de l'évènement PASSWORD_RECOVERY.
    const valide = await this.auth.verifierSessionRecuperation();
    this.etat.set(valide ? 'formulaire' : 'invalide');
  }

  async soumettre() {
    if (!REGEX_MDP.test(this.nouveauMdp)) {
      this.erreur.set(this.translate.instant('auth.erreurs.motDePasseCourt'));
      return;
    }
    if (this.nouveauMdp !== this.confirmMdp) {
      this.erreur.set(this.translate.instant('auth.reinit.erreurMismatch'));
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    try {
      await this.auth.modifierMotDePasse(this.nouveauMdp);
      this.etat.set('succes');
      setTimeout(() => this.router.navigate(['/tabs/carte'], { replaceUrl: true }), 1800);
    } catch (err: any) {
      console.error('[ReinitialiserMotDePasse] Erreur Supabase :', err);
      this.erreur.set(this.translate.instant('auth.erreurs.generique'));
    } finally {
      this.chargement.set(false);
    }
  }
}
