-- Nouvelles photos importées dans le bucket "photos" (lot de 15, 2026-10-22)
-- 10 photos rattachées ici à des points existants (point_images).
-- Les 4 restantes (berezowski, transmission des consignes, evasion raoul, bastonnade)
-- ne sont pas utilisées pour l'instant, sur demande explicite.
-- "camp central - le tambour aveugle_result_result.avif" est traitée à part :
-- elle devient le portrait d'un personnage rattaché à boulevard_du_crime
-- (voir migrations_personnage_tambour_aveugle.sql, en attente du texte).

-- Village des libérés
insert into point_images (point_id, chemin, ordre, banniere) values
('village_des_liberes', 'village des liberes- en arriere plan la prison des liberes_result_result.avif', 2, false),
('village_des_liberes', 'village des liberes a la ferme nord _result_result.avif', 3, false);

-- Cimetière des surveillants militaires
insert into point_images (point_id, chemin, ordre, banniere) values
('cimetiere_surveillants_militaires', 'tombe du surveillant militaire Lafage et de son epouse-cimetiere des surveillants_result_result.avif', 3, false);

-- Les Ateliers de l'Île Nou
insert into point_images (point_id, chemin, ordre, banniere) values
('ateliers', 'scierie_result_result.avif', 4, false),
('ateliers', 'machine principale_result_result.avif', 5, false),
('ateliers', 'forge et atelier fer_result_result.avif', 6, false),
('ateliers', 'atelier fonderie_result_result.avif', 7, false);

-- Magasin à vivre
insert into point_images (point_id, chemin, ordre, banniere) values
('magasin_a_vivre', 'magasin des vivres_result_result.avif', 2, false);

-- Quartier cellulaire
insert into point_images (point_id, chemin, ordre, banniere) values
('quartier_cellulaire', 'la maison de detention - quatier cellulaire_result_result.avif', 5, false);

-- Hôtel du Commandant
insert into point_images (point_id, chemin, ordre, banniere) values
('hotel_du_commandant', 'hotel du directeur_result_result.avif', 4, false);
