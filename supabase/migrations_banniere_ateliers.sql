-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : bannière du point Ateliers
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_points_v3.sql et migrations_point_images_bannieres.sql,
-- déjà exécutées — même principe : un point à plusieurs photos n'affiche
-- rien tant qu'aucune n'est choisie comme bannière)
--
-- Les 3 photos du point "ateliers" ont été vérifiées : "batiment H_result.avif"
-- est nette et bien cadrée (choisie comme bannière) ; "batiment en H des
-- ateliers_result.avif" est à l'envers (90°) et "IMG_4818_result_result.avif"
-- est une photo d'une page du livre source plutôt qu'une photo du lieu —
-- décision validée de les garder quand même dans le carrousel, en l'état.
-- ─────────────────────────────────────────────────────────────────────────────

update point_images set banniere = true
where point_id = 'ateliers' and chemin = 'batiment H_result.avif';
