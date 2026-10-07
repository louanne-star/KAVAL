-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos Camp Est, Château d'Eau, Hôtel du
-- Commandant, Hôpital du Marais, Logement du surveillant principal
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- - Camp Est et Château d'Eau et Tour de guet et Hôtel du Commandant
--   n'avaient aucune photo : 1ère illustration de ces 3 points.
--   Camp Est utilisait jusqu'ici une image codée en dur dans le CSS
--   (.detail-header.zone-camp_est) en l'absence de vraie photo en base ;
--   cette règle est retirée du SCSS, le point utilise maintenant le système
--   de bannière standard comme tous les autres points.
-- - Hôpital du Marais et Logement du surveillant principal : ajout de
--   photos supplémentaires à celles déjà en place.
-- Tous les fichiers ont été vérifiés présents dans le bucket "photos"
-- (HEAD 200) avant d'écrire cette migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Camp Est (nouveau, 4 photos) ────────────────────────────────────────────
insert into point_images (point_id, chemin, ordre, legende) values
  ('camp_est_principal', 'vue du camp est_result.avif', 1,
   'Vue générale du Camp est, circa 1900. Au premier plan, les jardins qui fournissent des légumes frais pour l''alimentation des condamnés et du personnel de l''Administration pénitentiaire. Album Demore, ANC.'),
  ('camp_est_principal', 'chapelle du camp est_result.avif', 2,
   'La chapelle Saint-Michel au Camp est, circa 1980. Cliché collection Marcel C. Pétron.'),
  ('camp_est_principal', 'condamnes du camp est_result.avif', 3,
   'Condamnés du Camp est travaillant aux jardins sous le regard de surveillants militaires. Collection Louis Lagarde, ANC.'),
  ('camp_est_principal', 'camp est avec au premier plan la prison cellulaire_result.avif', 4,
   'Le Camp est avec, au premier plan, la prison cellulaire, puis sur la colline dominant le camp, la maison du commandant. Collection ANC.')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;

update point_images set banniere = true
where point_id = 'camp_est_principal' and chemin = 'vue du camp est_result.avif';

-- ── Château d'Eau et Tour de guet (nouveau, 1 photo -> bannière automatique) ─
insert into point_images (point_id, chemin, ordre, legende) values
  ('chateau_eau_tour_guet', 'chateau d''eau.jpg', 1,
   'En 1886, à l''arrière de l''hôtel du commandant de l''île Nou, à proximité d''un puits, est élevé un château d''eau. Cliché (détail) collection Kakou, ANC.')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;

-- ── Hôtel du Commandant (nouveau, 3 photos) ─────────────────────────────────
insert into point_images (point_id, chemin, ordre, legende) values
  ('hotel_du_commandant', 'hotel du commandant superieur_result_result.avif', 1,
   'L''hôtel du commandant supérieur de l''île Nou pavoisé pour la fête nationale, vers 1893. Au premier plan, le quai du commandant et le jardin anglais ; sur la droite, le kiosque du commandant. Cliché Théotime Bray, ANOM (ANC).'),
  ('hotel_du_commandant', 'hotel1.jpg', 2,
   'L''hôtel mesure 27 m de long sur 15 m de large, ouvert sur un vaste jardin anglais à l''accent calédonien (bois noir, pandanus, pieds d''oranges, aloe vera), où plusieurs commandants supérieurs ont séjourné. Au premier plan, un garde indigène armé d''un casse-tête à bec d''oiseau et de sagaies.'),
  ('hotel_du_commandant', 'hotel2.jpg', 3,
   'L''entrée principale, avec son escalier double en pierres de taille et ses balustrades ajourées en croix ; au mur, du ficus pumila qu''on appelle « lierre » en Calédonie. Cliché Théotime Bray, circa 1893, ANOM (ANC).')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;

update point_images set banniere = true
where point_id = 'hotel_du_commandant' and chemin = 'hotel du commandant superieur_result_result.avif';

-- ── Hôpital du Marais (3 photos de plus, s'ajoutent aux 3 déjà en place) ────
insert into point_images (point_id, chemin, ordre, legende) values
  ('hopital_du_marais', 'malades a l''hopital _result_result.avif', 4,
   'Malades à l''hôpital de l''île Nou, vers 1910. Collection Louis Lagarde, ANC.'),
  ('hopital_du_marais', 'enttree hopital marais_result_result.avif', 5,
   'L''entrée de l''hôpital du Marais vers 1914 ; le surveillant Albert Pérault et sa famille. Sous l''arcade, une lourde porte en bois à deux battants a été ajoutée, avec une poterne dans le battant de droite. Album Demore, ANC.'),
  ('hopital_du_marais', 'allee de cocotier conduisant a l''hopital_result.avif', 6,
   'L''allée de cocotiers conduisant à l''hôpital. « Une route, large comme un boulevard, bordée de magnifiques cocotiers, longue d''un bon kilomètre, conduit en traversant l''île entre deux collines, du pénitencier central à l''hôpital principal de la Transportation ou hôpital du Marais, situé au bord de la mer... », Dr Grosperrin. Album Demore, ANC.')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;

-- ── Logement du surveillant principal (1 photo de plus : passe de 1 à 2 photos,
--    une bannière doit donc être choisie explicitement) ─────────────────────
insert into point_images (point_id, chemin, ordre, legende) values
  ('logement_surveillant_principal', 'logement surveillant principal.jpg', 2,
   'Au centre, au bord du quai que longe une balustrade en bois, le logement du surveillant principal, actuellement occupé par le CREIPAC, et qui fut une infirmerie dans les années 1950-1960. Cliché (détail), collection ANC.')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;

update point_images set banniere = true
where point_id = 'logement_surveillant_principal' and chemin = 'logement du surveillant principal_result_result.avif';
