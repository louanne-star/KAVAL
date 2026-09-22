import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';
import { TRANSLATIONS, Langue } from '../i18n/translations';

const CLE = 'kaval_langue';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  readonly langue = signal<Langue>('fr');

  constructor(private translate: TranslateService) {
    this.translate.setTranslation('fr', TRANSLATIONS.fr);
    this.translate.setTranslation('en', TRANSLATIONS.en);
    this.translate.use('fr');

    Preferences.get({ key: CLE }).then(({ value }) => {
      if (value === 'en' || value === 'fr') this.changerLangue(value);
    });
  }

  changerLangue(langue: Langue): void {
    this.langue.set(langue);
    this.translate.use(langue);
    Preferences.set({ key: CLE, value: langue });
  }
}
