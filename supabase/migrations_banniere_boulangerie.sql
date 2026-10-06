-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : bannière du point Boulangerie
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images_bannieres.sql, déjà exécutée — même
-- principe : un point à plusieurs photos n'affiche rien tant qu'aucune n'est
-- choisie comme bannière)
--
-- Les 2 photos d'origine du point "boulangerie" étaient à l'envers (90°) ;
-- elles ont été remplacées dans le bucket "photos" par des versions
-- correctement orientées (mêmes noms de fichier). "boulangerie_result.avif"
-- (vue avec le réverbère) est choisie comme bannière.
-- ─────────────────────────────────────────────────────────────────────────────

update point_images set banniere = true
where point_id = 'boulangerie' and chemin = 'boulangerie_result.avif';
