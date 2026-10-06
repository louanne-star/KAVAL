-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos du point Logement des surveillants mariés
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_point_images.sql et migrations_point_images_bannieres.sql,
-- déjà exécutées)
--
-- Les 6 photos de ce point avaient échoué à l'import initial (noms accentués
-- rejetés par l'API Storage, voir migrations_point_images.sql:35-39). Elles
-- ont été ré-uploadées sans accent (é/à/è -> e/a/e) et sont maintenant
-- confirmées présentes dans le bucket "photos". Le point n'avait jusqu'ici
-- qu'une seule photo (FE909B83...), qui servait de bannière automatique ;
-- avec 7 photos désormais, une bannière doit être choisie explicitement
-- (sinon rien ne s'affiche, voir migrations_point_images_bannieres.sql).
-- "la caserne des surveillants maries_result.avif" est choisie comme
-- bannière (vue d'ensemble du bâtiment).
-- ─────────────────────────────────────────────────────────────────────────────

insert into point_images (point_id, chemin, ordre) values
  ('logement_surveillants_militaires_maries', 'caserne des suveillants maries_result.avif',                        2),
  ('logement_surveillants_militaires_maries', 'couloir a la caserne des surveillants maries_result.avif',          3),
  ('logement_surveillants_militaires_maries', 'garde indigenes devant la caserne des suveillants maries_result.avif', 4),
  ('logement_surveillants_militaires_maries', 'la caserne des surveillants maries_result.avif',                    5),
  ('logement_surveillants_militaires_maries', 'la caserne des surveillants maries2_result.avif',                   6),
  ('logement_surveillants_militaires_maries', 'petite caserne des surveillant maries_result_result.avif',          7)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;

update point_images set banniere = true
where point_id = 'logement_surveillants_militaires_maries'
  and chemin = 'la caserne des surveillants maries_result.avif';
