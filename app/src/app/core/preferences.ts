// Remplace @capacitor/preferences : Kaval est désormais une web app pure (PWA),
// sans pont natif Capacitor. Même API (get/set/remove) et même préfixe de clé
// ("CapacitorStorage.") que l'implémentation web de @capacitor/preferences, pour
// ne pas perdre les données déjà enregistrées par les utilisateurs existants
// (badges, parcours, favoris, langue, tutoriel...).

const PREFIXE = 'CapacitorStorage.';

export const Preferences = {
  async get(options: { key: string }): Promise<{ value: string | null }> {
    return { value: localStorage.getItem(PREFIXE + options.key) };
  },

  async set(options: { key: string; value: string }): Promise<void> {
    localStorage.setItem(PREFIXE + options.key, options.value);
  },

  async remove(options: { key: string }): Promise<void> {
    localStorage.removeItem(PREFIXE + options.key);
  },
};
