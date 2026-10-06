-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos du point Boulevard du Crime
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images.sql et migrations_point_images_bannieres.sql,
-- déjà exécutées — Boulevard du Crime y était laissé EN ATTENTE)
--
-- "lieu des execution_result_result.avif" (incluse initialement malgré un
-- doute exprimé) est retirée, remplacée par "camp central_result.avif",
-- déplacée depuis le point Quartier cellulaire (qui n'a donc plus aucune
-- photo après cette migration). "guillotine_result.avif" devient la
-- bannière du point.
-- ─────────────────────────────────────────────────────────────────────────────

delete from point_images
where point_id = 'boulevard_du_crime' and chemin = 'lieu des execution_result_result.avif';

delete from point_images
where point_id = 'quartier_cellulaire' and chemin = 'camp central_result.avif';

insert into point_images (point_id, chemin, ordre) values
  ('boulevard_du_crime', 'camp central_result.avif', 2)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;

update point_images set banniere = true
where point_id = 'boulevard_du_crime' and chemin = 'guillotine_result.avif';
