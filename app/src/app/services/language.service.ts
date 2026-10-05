import { Injectable, signal } from '@angular/core';
import { Preferences } from '../core/preferences';
import { TranslateService } from '@ngx-translate/core';
import { TRANSLATIONS, Langue } from '../i18n/translations';

const CLE = 'kaval_langue';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  readonly langue = signal<Langue>('fr');

  constructor(private translate: TranslateService) {
    this.translate.setTranslation('fr', TRANSLATIONS.fr);
    this.translate.setTranslation('en', TRANSLATIONS.en);

    // Tant qu'aucune préférence n'a été enregistrée (premier lancement), on
    // devine la langue depuis celle du téléphone/navigateur plutôt que de
    // forcer le français à un touriste anglophone — l'app ne gérant que
    // fr/en, tout ce qui n'est pas français bascule sur l'anglais.
    const devinee = this.detecterLangueNavigateur();
    this.langue.set(devinee);
    this.translate.use(devinee);

    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value === 'en' || value === 'fr') this.changerLangue(value);
    });
  }

  private detecterLangueNavigateur(): Langue {
    const nav = typeof navigator !== 'undefined' ? navigator.language : '';
    return nav?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  changerLangue(langue: Langue): void {
    this.langue.set(langue);
    this.translate.use(langue);
    Preferences.set({ key: CLE, value: langue });
  }
}
