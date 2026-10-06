import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';

type Statut = 'chargement' | 'valide' | 'deja_utilisee' | 'introuvable';

@Component({
  selector: 'app-verifier-recompense',
  templateUrl: './verifier-recompense.page.html',
  styleUrls: ['./verifier-recompense.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class VerifierRecompensePage implements OnInit {

  code = '';
  statut = signal<Statut>('chargement');
  pseudo = signal<string | null>(null);
  utiliseeLe = signal<string | null>(null);

  pin = '';
  validation      = signal(false);
  erreurPin       = signal<string | null>(null);
  succesValidation = signal(false);

  constructor(
    private route:    ActivatedRoute,
    private supabase: SupabaseService,
  ) {}

  async ngOnInit() {
    this.code = (this.route.snapshot.paramMap.get('code') ?? '').toUpperCase();
    if (!this.code) { this.statut.set('introuvable'); return; }

    try {
      const { data } = await this.supabase.client.rpc('get_reward_status', { p_code: this.code });
      if (!data?.trouve) { this.statut.set('introuvable'); return; }
      this.pseudo.set(data.pseudo ?? null);
      if (data.utilisee) {
        this.utiliseeLe.set(data.utilisee_le ?? null);
        this.statut.set('deja_utilisee');
      } else {
        this.statut.set('valide');
      }
    } catch {
      this.statut.set('introuvable');
    }
  }

  async valider() {
    if (!this.pin.trim()) return;
    this.validation.set(true);
    this.erreurPin.set(null);
    try {
      const { data } = await this.supabase.client.rpc('redeem_reward', { p_code: this.code, p_pin: this.pin.trim() });
      if (data?.ok) {
        this.succesValidation.set(true);
        this.statut.set('deja_utilisee');
        this.utiliseeLe.set(new Date().toISOString());
      } else if (data?.erreur === 'pin_invalide') {
        this.erreurPin.set('PIN incorrect.');
      } else if (data?.erreur === 'deja_utilisee') {
        this.statut.set('deja_utilisee');
        this.utiliseeLe.set(data.utilisee_le ?? null);
      } else {
        this.erreurPin.set('Code introuvable.');
      }
    } catch {
      this.erreurPin.set('Erreur réseau, réessayez.');
    } finally {
      this.validation.set(false);
    }
  }

  formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
