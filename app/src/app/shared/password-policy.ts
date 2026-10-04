// Politique de mot de passe commune à l'inscription, à la modification depuis le
// compte et à la réinitialisation par e-mail : au moins 8 caractères, une
// majuscule, une minuscule et un chiffre (recommandation CNIL pour une
// authentification par mot de passe seul).
export const REGEX_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function motDePasseValide(mdp: string): boolean {
  return REGEX_MDP.test(mdp);
}
