-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : remplace une photo du point Ateliers
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_points_v3.sql et migrations_banniere_ateliers.sql)
--
-- "IMG_4818_result_result.avif" (photo d'une page du livre, pas du lieu)
-- est retirée du carrousel et remplacée par "atelier1.jpg" (déjà présente
-- dans le bucket "photos").
-- ─────────────────────────────────────────────────────────────────────────────

delete from point_images
where point_id = 'ateliers' and chemin = 'IMG_4818_result_result.avif';

insert into point_images (point_id, chemin, ordre) values
  ('ateliers', 'atelier1.jpg', 3)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;
