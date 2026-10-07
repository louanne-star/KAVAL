-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : légendes pour 4 photos popup
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_photos_popups_batch1.sql, _batch2.sql et
-- _photos_parc_a_charbon.sql, déjà exécutées — ces 4 lignes doivent déjà
-- exister dans point_images, sinon cet UPDATE ne fait rien)
--
-- Légendes raccourcies pour tenir sous la photo plein écran (école et parc
-- à charbon étaient plus longues, détails secondaires retirés en gardant
-- le fait principal + l'attribution).
-- ─────────────────────────────────────────────────────────────────────────────

update point_images set legende =
  'Les cases de la léproserie de la pointe Kungu à l''île Nou. Collection Louis-Georges Viale.'
where point_id = 'leproserie' and chemin = 'case leproserie_result.avif';

update point_images set legende =
  'L''école de l''île Nou réunit l''école des filles, celle des garçons et les logements de l''institutrice et de l''instituteur, dans un bâtiment de 33 m sur 11 m. Cliché Léon Devambez, ANC.'
where point_id = 'ecole_primaire_surveillants' and chemin = 'ecole des filles et garcons_result_result.avif';

update point_images set legende =
  'Le parc à charbon, circa 1893 : un hangar d''où un chemin de fer Decauville rejoint la jetée d''embarquement du charbon, pour les besoins de l''administration et de la flotte. Cliché Théotime Bray, ANOM.'
where point_id = 'parc_a_charbon' and chemin = 'parc a charbon_result.avif';

update point_images set legende =
  'Le jardin potager de l''asile des aliénés. Les médecins le jugent nécessaire à leur thérapie : il sert à les « occuper » et à les « distraire ». Cliché Théotime Bray, collection Bray/Fayard.'
where point_id = 'jardin_hopital_logement_surveillant' and chemin = 'le jardin potager de lasile des alienes_result.avif';
