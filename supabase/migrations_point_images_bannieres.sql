-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : bannière des points + nettoyage de 3 photos
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images.sql, déjà exécutée)
--
-- Ajoute la colonne `banniere` : quand un point a plusieurs photos, une seule
-- est marquée bannière (affichée derrière le titre, à la place du fond bleu
-- uni — même principe que detail-header.zone-camp_est côté app) ; les autres
-- vont dans un carrousel sous le mini-jeu, bannière incluse en dernière
-- position. Quand un point n'a qu'une seule photo, elle sert de bannière
-- automatiquement (pas besoin de ce flag) et aucun carrousel ne s'affiche.
--
-- Décisions de contenu validées :
--  - Chapelle Saint-Thomas : retire "chapelle saint thomas_result_result.avif",
--    doublon de moins bonne qualité de "chapelle_result.avif" (qui devient
--    donc la bannière automatique, seule image restante).
--  - Hôtel du Commandant : retire les 2 photos, aucune n'est exploitable.
--  - Hôpital du Marais : bannière = "jardin de l'hopital du marais_result.avif".
--  - Boulevard du Crime : laissé EN ATTENTE (aucun flag banniere) — les 2
--    photos restent en base mais ne s'affichent nulle part tant qu'une
--    décision n'est pas prise (la logique app n'affiche rien pour un point à
--    plusieurs photos sans bannière choisie, voir points.service.ts).
-- ─────────────────────────────────────────────────────────────────────────────

alter table point_images add column if not exists banniere boolean not null default false;

delete from point_images where chemin = 'chapelle saint thomas_result_result.avif';
delete from point_images where point_id = 'hotel_du_commandant';

update point_images set banniere = true
where point_id = 'hopital_du_marais' and chemin = 'jardin de l''hopital du marais_result.avif';
