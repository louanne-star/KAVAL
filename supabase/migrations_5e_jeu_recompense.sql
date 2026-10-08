-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Ajoute le jeu des 7 différences aux jeux requis pour la récompense
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Jusqu'ici mini_jeux_points ne listait que les 4 jeux d'origine. Le 5e jeu
-- (logement_surveillants_militaires_maries, "Les 7 différences") enregistrait
-- déjà sa victoire dans user_games_won, mais ne comptait pas pour le
-- déclenchement de la récompense (voir migrations_recompenses.sql) — et
-- faussait l'affichage de la progression dans Compte (le nombre de jeux
-- gagnés pouvait dépasser le total affiché).
--
-- Après cette migration, les 5 mini-jeux sont requis pour obtenir le QR code.
-- Les joueurs ayant déjà une récompense (créée quand il n'y avait que 4 jeux
-- requis) ne sont pas affectés : le trigger ne revérifie pas les récompenses
-- déjà créées.
-- ─────────────────────────────────────────────────────────────────────────────

insert into mini_jeux_points (point_id) values
  ('logement_surveillants_militaires_maries')
on conflict (point_id) do nothing;
