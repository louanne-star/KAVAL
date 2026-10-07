-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos des points popup (lot 1) + légendes
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images.sql, déjà exécutée)
--
-- Ajoute une légende optionnelle par photo (affichée en italique sous la
-- photo en plein écran), pour les cas où une attribution/explication est
-- nécessaire (ex. citation d'archive).
--
-- 6 des 12 photos demandées sont confirmées présentes dans le bucket et
-- rattachées ici. Les 6 autres ont échoué (noms accentués rejetés par l'API
-- Storage, même souci que d'habitude) et ne sont PAS dans ce script —
-- à ré-uploader sans accent :
--   case léproserie_result.avif
--   emplacement de la léproserie_result_result.avif
--   lépreux_result.avif          (légende prévue, voir migrations_photos_popups_batch2.sql à venir)
--   transportes lépreux_result.avif (légende prévue, idem)
--   le jardin potager de l'asile des aliénés_result.avif
--   parc à charbon_result.avif
-- ─────────────────────────────────────────────────────────────────────────────

alter table point_images add column if not exists legende text;
alter table point_images add column if not exists legende_en text;

insert into point_images (point_id, chemin, ordre) values
  ('ferme_nord_luzerne', 'champ de luzerne ferme nord_result.avif', 1),
  ('ferme_nord_luzerne', 'ferme nord_result.avif',                  2),
  ('ferme_nord_luzerne', 'ferme nord_result_result.avif',           3),
  ('ferme_nord_luzerne', 'ferme nord2_result.avif',                 4),

  ('ecole_primaire_surveillants', 'ecole des filles et garcons_result_result.avif', 1)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;

-- "cases de la leproserie_result.avif" est déjà rattachée à leproserie
-- depuis migrations_point_images.sql (ordre 1) — rien à refaire ici.
