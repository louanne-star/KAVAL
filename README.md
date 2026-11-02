# Forçats'Nou

*(nom de code du dépôt : KAVAL, nom de projet initial avant le rebranding)*

Application web (PWA, responsive mobile) de visite guidée de l'ancien bagne de l'Île Nou (Nouvelle-Calédonie), pour l'association Témoignage d'un passé (ATUP). L'utilisateur se déplace physiquement sur le site, débloque les zones du parcours au fur et à mesure de sa progression GPS, découvre le contenu historique de chaque point (récits, témoignages, quiz) et gagne des badges en complétant des mini-jeux.

🔗 Démo en ligne : [forcats-nou.netlify.app](https://forcats-nou.netlify.app)

## Stack technique

| Couche | Techno | Rôle |
|---|---|---|
| Frontend | Ionic 8 + Angular 20 (standalone components, signals) | UI web responsive, pensée mobile-first (usage sur site, en extérieur) |
| Carte | Leaflet + MapLibre (fond vectoriel), bascule vue satellite (tuiles Esri) | Carte interactive, position GPS, itinéraires |
| Backend | Supabase (Postgres + API REST auto-générée + Auth) | Stockage du contenu et des données utilisateur, sans serveur applicatif à maintenir |
| Sécurité | Row Level Security (RLS) Postgres | Règles d'accès aux données définies en SQL plutôt que dans du code serveur |
| Hébergement web | Netlify | Build + déploiement automatique à chaque push sur `main` |
| PWA | `@angular/service-worker` + Web App Manifest | Installation sur l'écran d'accueil, mise en cache des pages/images, bandeau hors-ligne et de mise à jour |
| Navigation piétonne | OSRM (router.project-osrm.org) | Itinéraire en temps réel sur de vraies routes, avec instructions de virage |
| Internationalisation | `@ngx-translate/core` | Interface et contenu Supabase bilingues FR/EN, bascule instantanée |

Aucun serveur applicatif custom : le client Angular parle directement à l'API Supabase. La seule logique "métier" côté données vit dans les policies RLS et le schéma SQL (voir [supabase/](supabase/)).

Un document séparé explique en détail pourquoi ces choix techniques ont été faits (voir la discussion du projet / le dossier remis au professeur).

## Structure du repo

```
kaval/
├── app/                        # Application Ionic/Angular
│   ├── public/                 # Manifest PWA + icônes
│   ├── src/app/pages/          # Écrans : carte, parcours, à-propos, compte, favoris, recherche, auth, mentions-legales...
│   ├── src/app/onboarding/     # Premier lancement : permission GPS, installation de l'app, présentation de l'équipe
│   ├── src/app/splash/         # Écran de démarrage (redirige vers login ou carte selon la session)
│   ├── src/app/components/     # Composants partagés (tutorial-overlay, legal-footer-link...)
│   ├── src/app/services/       # Logique métier (points, parcours/GPS, badges, récompense, sync, notes, commentaires, favoris, langue, installation, connexion réseau, mise à jour)
│   ├── src/app/i18n/           # Dictionnaire de traduction FR/EN (translations.ts)
│   ├── src/assets/mini-jeux/   # Mini-jeux embarqués en iframe (copie de mini-jeux/, voir plus bas)
│   ├── ngsw-config.json        # Config du service worker (ce qui est mis en cache, et comment)
│   └── src/environments/       # Config Supabase (dev/prod)
├── mini-jeux/                  # Sources des mini-jeux HTML/JS autonomes (tribunal, argot, evasion, memoire, 7 différences)
└── supabase/                   # Migrations SQL (schéma + contenu), à exécuter dans Supabase SQL Editor
```

## Fonctionnement général

1. **Premier lancement** — l'utilisateur crée un compte (`auth.service.ts`, email/mot de passe via Supabase Auth), passe un onboarding qui demande la permission GPS, puis un tutoriel interactif (`tutorial.service.ts` + composant `tutorial-overlay`) met en surbrillance les éléments clés de l'interface un par un. Ensuite, l'app fonctionne hors-ligne grâce au cache local.
2. **Parcours géolocalisé** — `journey.service.ts` suit la position GPS de l'utilisateur (`watchPosition`), calcule la distance aux zones et débloque une zone quand l'utilisateur entre dans son rayon. Sans GPS (refusé ou indisponible), une position de secours (IUT) permet quand même de positionner les points sur la carte, mais aucun itinéraire n'est affiché.
3. **Itinéraire en direct** — sur la carte, un seul tracé est visible à la fois : par défaut vers le prochain point non visité, ou vers un point choisi en cliquant sur son bouton "itinéraire". Le tracé suit de vraies routes (OSRM) et affiche des instructions de virage en direct (distance avant de tourner) ; il n'apparaît que si une position GPS réelle est disponible.
4. **Contenu piloté depuis Supabase** — `points.service.ts` charge au démarrage : zones, points (vrais points GPS + popups d'info), témoignages, quiz et sections de texte (`point_sections`). Zones/points sont critiques (fallback sur un cache local `Preferences` si Supabase est injoignable) ; le reste est optionnel et ne bloque jamais l'affichage.
5. **Mini-jeux et badges** — chaque zone peut avoir un mini-jeu (fichier HTML/JS autonome, chargé en `<iframe>`), qui communique son résultat à l'app via `postMessage({ type: 'jeuTermine' })`. Réussir un mini-jeu octroie un badge (`badge.service.ts`) ; l'image du badge vient d'un bucket Supabase Storage dédié quand une illustration du musée existe pour ce point, sinon une icône générique est utilisée.
6. **Récompense de fin de parcours** — gagner tous les mini-jeux débloque une récompense avec un QR code (`reward.service.ts`), vérifiable via la page `verifier-recompense`.
7. **Communauté** — notes (1-5 étoiles) et commentaires par zone, synchronisés avec Supabase (`rating.service.ts`, `comment.service.ts`), lisibles par tous les utilisateurs connectés.
8. **Langue** — bascule FR/EN en direct (`language.service.ts`), appliquée à l'interface comme au contenu bilingue venant de Supabase (`pointsService.texte(fr, en)`).
9. **Installation et hors-ligne** — l'app peut être installée sur l'écran d'accueil (téléphone ou ordinateur) comme une app native, via le bouton proposé dans l'onboarding et dans Compte > Paramètres (`install.service.ts`). Une fois installée ou simplement ouverte une première fois, les pages et images déjà vues restent consultables hors connexion grâce au service worker ; un bandeau prévient quand l'app est hors-ligne (`connectivity.service.ts`) ou qu'une nouvelle version est disponible (`app-update.service.ts`).

## Schéma de données (Supabase)

Tables principales (voir [supabase/migrations_points.sql](supabase/migrations_points.sql) et [supabase/migrations.sql](supabase/migrations.sql)) :

- `zones` — les grandes étapes du parcours (Camp Est, Hôpital du Marais, Ferme Nord, Pénitencier, Vacherie), avec couleur/icône/ordre.
- `points` — points GPS individuels, de type `vrai` (déclenche le déblocage de zone) ou `popup` (info affichée au clic, sans influence sur la progression).
- `point_sections` — contenu long (Histoire, Guerre médicale...) affiché sur la page détail d'un point.
- `quiz_questions` — quiz à choix multiples (1 bonne réponse + 2 fausses) par point.
- `temoignages` — citations/témoignages historiques par point.
- `user_badges`, `user_ratings`, `user_comments`, `user_favorites`, `user_games_won` — données utilisateur, propriétaire par défaut (RLS), avec quelques policies de lecture élargies pour les vues communautaires (moyenne des notes, liste des commentaires).
- `mini_jeux_points` — liste des points ayant un mini-jeu, sert à calculer le total de jeux à gagner pour la récompense de fin de parcours.

Pour ajouter du contenu (texte, quiz...), il suffit d'insérer des lignes dans ces tables via le SQL Editor ou le Table Editor de Supabase — aucun redéploiement de l'app n'est nécessaire.

## Développement local

```bash
cd app
npm install
npm start          # ng serve — http://localhost:4200
```

La config Supabase (URL + clé anonyme) est dans `app/src/environments/environment.ts`. La clé anonyme est volontairement publique : elle est faite pour être exposée côté client, la sécurité réelle est portée par les policies RLS en base.

## Build & déploiement

- **Web** : chaque push sur `main` déclenche un build Netlify (`npm run build` → dossier `www`), publié automatiquement. Config dans [netlify.toml](netlify.toml).

## Limites connues / pistes d'amélioration

- Les e-mails de réinitialisation de mot de passe passent par le service mail intégré de Supabase, limité en nombre d'envois par heure et non personnalisé (expéditeur générique, textes par défaut) : à remplacer par un vrai fournisseur d'e-mail (SMTP dédié) avant un usage grand public.
- Pas de file d'attente hors-ligne : une action faite sans connexion (gagner un mini-jeu, poster un commentaire...) n'est renvoyée à Supabase que si l'app réessaie automatiquement au prochain lancement avec une connexion ; il n'y a pas de vraie file de synchronisation différée.
- Pas de tests automatisés qui couvrent réellement le fonctionnement de l'app (seuls les fichiers `.spec.ts` générés par défaut par Angular existent, non maintenus).
- Pas de CI (lint/build/tests) avant merge sur `main`.
- Pas d'environnement de staging séparé de la prod.
- Pas de version mobile packagée pour les stores (app web/PWA uniquement, pas de build Capacitor iOS/Android).
- La politique de confidentialité ([mentions-legales](app/src/app/pages/mentions-legales/mentions-legales.page.html)) est en français uniquement, pas traduite en anglais comme le reste de l'app.

## Et après ?

Ce dépôt correspond au livrable remis pour la SAE. À la demande de l'ATUP (notre commanditaire), le développement de l'application continue au-delà du rendu, porté par Ondine Taukolo et Lou-Anne Grosjean, pour finaliser les points listés ci-dessus et ajouter du contenu supplémentaire.
