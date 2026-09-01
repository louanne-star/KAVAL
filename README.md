# KAVAL

Application mobile/web de visite guidée de l'ancien bagne de l'Île Nou (Nouvelle-Calédonie). L'utilisateur se déplace physiquement sur le site, débloque les zones du parcours au fur et à mesure de sa progression GPS, découvre le contenu historique de chaque point (récits, témoignages, quiz) et gagne des badges en complétant des mini-jeux.

🔗 Démo en ligne : [kaval.netlify.app](https://kaval.netlify.app)

## Stack technique

| Couche | Techno | Rôle |
|---|---|---|
| Frontend | Ionic 8 + Angular 20 (standalone components, signals) | UI web/mobile unique (un seul code pour web, Android, iOS) |
| Carte | Leaflet + tuiles Esri Light Gray Canvas | Carte interactive, position GPS, itinéraires |
| Backend | Supabase (Postgres + API REST auto-générée + Auth) | Stockage du contenu et des données utilisateur, sans serveur applicatif à maintenir |
| Sécurité | Row Level Security (RLS) Postgres | Règles d'accès aux données définies en SQL plutôt que dans du code serveur |
| Hébergement web | Netlify | Build + déploiement automatique à chaque push sur `main` |
| Mobile | Capacitor 8 | Empaquetage de l'app web en app Android/iOS native |
| Navigation piétonne | OSRM (router.project-osrm.org) | Calcul d'itinéraire à pied en temps réel |

Aucun serveur applicatif custom : le client Angular parle directement à l'API Supabase. La seule logique "métier" côté données vit dans les policies RLS et le schéma SQL (voir [supabase/](supabase/)).

## Structure du repo

```
kaval/
├── app/                      # Application Ionic/Angular
│   ├── src/app/pages/        # Écrans : carte, parcours, à-propos, compte, favoris, recherche, auth
│   ├── src/app/services/     # Logique métier (points, parcours/GPS, badges, sync, notes, commentaires, favoris)
│   ├── src/assets/mini-jeux/ # Mini-jeux embarqués en iframe (copie de mini-jeux/, voir plus bas)
│   ├── android/, ios/        # Projets natifs générés par Capacitor
│   └── src/environments/     # Config Supabase (dev/prod)
├── mini-jeux/                # Sources des mini-jeux HTML/JS autonomes (river_jump, tribunal, bagne-connect, memoire)
└── supabase/                 # Migrations SQL (schéma + contenu), à exécuter dans Supabase SQL Editor
```

## Fonctionnement général

1. **Parcours géolocalisé** — `journey.service.ts` suit la position GPS de l'utilisateur (`watchPosition`), calcule la distance aux zones et débloque une zone quand l'utilisateur entre dans son rayon. Sans GPS (refusé ou indisponible), une position de secours (IUT) permet quand même de visualiser le parcours.
2. **Contenu piloté depuis Supabase** — `points.service.ts` charge au démarrage : zones, points (vrais points GPS + popups d'info), témoignages, quiz et sections de texte (`point_sections`). Zones/points sont critiques (fallback sur un cache local `Preferences` si Supabase est injoignable) ; le reste est optionnel et ne bloque jamais l'affichage.
3. **Mini-jeux** — chaque zone peut avoir un mini-jeu (fichier HTML/JS autonome, chargé en `<iframe>`), qui communique son résultat à l'app via `postMessage({ type: 'jeuTermine' })`. Réussir un mini-jeu octroie un badge (`badge.service.ts`).
4. **Communauté** — notes (1-5 étoiles) et commentaires par zone, synchronisés avec Supabase (`rating.service.ts`, `comment.service.ts`), lisibles par tous les utilisateurs connectés.
5. **Authentification** — email/mot de passe via Supabase Auth (`auth.service.ts`), requise uniquement au premier lancement ; l'app fonctionne ensuite hors-ligne grâce au cache local.

## Schéma de données (Supabase)

Tables principales (voir [supabase/migrations_points.sql](supabase/migrations_points.sql) et [supabase/migrations.sql](supabase/migrations.sql)) :

- `zones` — les grandes étapes du parcours (Camp Est, Hôpital du Marais, Ferme Nord, Pénitencier, Vacherie), avec couleur/icône/ordre.
- `points` — points GPS individuels, de type `vrai` (déclenche le déblocage de zone) ou `popup` (info affichée au clic, sans influence sur la progression).
- `point_sections` — contenu long (Histoire, Guerre médicale...) affiché sur la page détail d'un point.
- `quiz_questions` — quiz à choix multiples (1 bonne réponse + 2 fausses) par point.
- `temoignages` — citations/témoignages historiques par point.
- `user_badges`, `user_ratings`, `user_comments`, `user_favorites` — données utilisateur, propriétaire par défaut (RLS), avec quelques policies de lecture élargies pour les vues communautaires (moyenne des notes, liste des commentaires).

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
- **Mobile** : `npx cap sync android` régénère le projet Android à partir du build web, à ouvrir ensuite dans Android Studio. Pas encore de pipeline CI pour ce build (étape manuelle).

## Limites connues / pistes d'amélioration

- Pas de CI (lint/build/tests) avant merge sur `main`.
- Pas d'environnement de staging séparé de la prod.
- `capacitor.config.ts` a encore l'`appId` par défaut (`io.ionic.starter`) — à changer avant publication sur un store.
- Build mobile non automatisé.
