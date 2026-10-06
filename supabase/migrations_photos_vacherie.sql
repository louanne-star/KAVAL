-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos du point La Vacherie (Ferme)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images.sql et migrations_point_images_bannieres.sql,
-- déjà exécutées)
--
-- "mace devant son habitation à la vacherie_result.avif" et "macé devant sa
-- cabane_result.avif" avaient échoué à l'import initial (noms accentués
-- rejetés par l'API Storage, voir migrations_point_images.sql:30-31). Elles
-- ont été ré-uploadées sans accent et sont maintenant confirmées présentes
-- dans le bucket "photos". Le point n'avait jusqu'ici qu'une seule photo
-- ("la vacherie_result.avif"), qui servait de bannière automatique ; avec
-- 3 photos désormais, une bannière doit être choisie explicitement (sinon
-- rien ne s'affiche, voir migrations_point_images_bannieres.sql).
-- "la vacherie_result.avif" reste la bannière (vue d'ensemble de la ferme).
-- ─────────────────────────────────────────────────────────────────────────────

insert into point_images (point_id, chemin, ordre) values
  ('la_vacherie_ferme', 'mace devant son habitation a la vacherie_result.avif', 2),
  ('la_vacherie_ferme', 'mace devant sa cabane_result.avif',                    3)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;

update point_images set banniere = true
where point_id = 'la_vacherie_ferme' and chemin = 'la vacherie_result.avif';
