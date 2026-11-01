// Remplace @capacitor/preferences maintenant que l'app est une PWA pure.
// Même API et même préfixe de clé, pour ne pas perdre les données déjà
// enregistrées par les utilisateurs existants.

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
