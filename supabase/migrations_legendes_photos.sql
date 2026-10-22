-- Légendes fournies pour les photos du dernier lot (+ four à chaux, déjà en
-- place mais sans légende).

update point_images set legende = 'Scierie. Cliché Théotime Bray, ANOM (ANC).', legende_en = 'Sawmill. Photograph by Théotime Bray, ANOM (ANC).'
where point_id = 'ateliers' and chemin = 'scierie_result_result.avif';

update point_images set legende = 'Atelier fonderie. Cliché Théotime Bray, ANOM (ANC).', legende_en = 'Foundry workshop. Photograph by Théotime Bray, ANOM (ANC).'
where point_id = 'ateliers' and chemin = 'atelier fonderie_result_result.avif';

update point_images set legende = 'Machine principale. Cliché Théotime Bray, ANOM (ANC).', legende_en = 'Main engine. Photograph by Théotime Bray, ANOM (ANC).'
where point_id = 'ateliers' and chemin = 'machine principale_result_result.avif';

update point_images set legende = 'Forge et atelier fer. Cliché Dufty, ANC.', legende_en = 'Forge and ironworking workshop. Photograph by Dufty, ANC.'
where point_id = 'ateliers' and chemin = 'forge et atelier fer_result_result.avif';

update point_images set
  legende = 'Tombe du surveillant militaire Lafage et de son épouse, cimetière des surveillants, Camp est. Collection Louis Lagarde, ANC.',
  legende_en = 'Grave of military guard Lafage and his wife, guards'' cemetery, Camp East. Louis Lagarde collection, ANC.'
where point_id = 'cimetiere_surveillants_militaires'
  and chemin = 'tombe du surveillant militaire Lafage et de son epouse-cimetiere des surveillants_result_result.avif';

update point_images set
  legende = 'Rencontre des familles Bray et Terrier devant leur logement à l''arrière du magasin des vivres. Cliché Théotime Bray, collection Bray/Fayard.',
  legende_en = 'Meeting of the Bray and Terrier families in front of their lodging behind the food store. Photograph by Théotime Bray, Bray/Fayard collection.'
where point_id = 'magasin_a_vivre' and chemin = 'magasin des vivres_result_result.avif';

update point_images set
  legende = 'La maison de détention de l''île Nou. Cliché Théotime Bray, ANOM (ANC).',
  legende_en = 'The Île Nou detention house. Photograph by Théotime Bray, ANOM (ANC).'
where point_id = 'quartier_cellulaire' and chemin = 'la maison de detention - quatier cellulaire_result_result.avif';

update point_images set
  legende = 'L''hôtel du directeur de l''Administration pénitentiaire, boulevard Vauban. Cliché Théotime Bray, ANOM (ANC).',
  legende_en = 'The penitentiary administration director''s residence, boulevard Vauban. Photograph by Théotime Bray, ANOM (ANC).'
where point_id = 'hotel_du_commandant' and chemin = 'hotel du directeur_result_result.avif';

update point_images set
  legende = 'N''Du. Au premier plan, le village des libérés. En arrière-plan, la prison des libérés et le bâtiment cellulaire de Ducos. Collection Kakou, ANC.',
  legende_en = 'N''Du. In the foreground, the freedmen''s village. In the background, the freedmen''s prison and the Ducos cell block. Kakou collection, ANC.'
where point_id = 'village_des_liberes'
  and chemin = 'village des liberes- en arriere plan la prison des liberes_result_result.avif';

update point_images set
  legende = 'Village de libérés à la Ferme Nord, île Nou. Cliché Ernest Robin, ANOM (ANC).',
  legende_en = 'Freedmen''s village at Ferme Nord, Île Nou. Photograph by Ernest Robin, ANOM (ANC).'
where point_id = 'village_des_liberes' and chemin = 'village des liberes a la ferme nord _result_result.avif';

update point_images set
  legende = 'Le four à chaux à la pointe Denouël. Cliché Allan Hughan, State Library of NSW.',
  legende_en = 'The lime kiln at pointe Denouël. Photograph by Allan Hughan, State Library of NSW.'
where point_id = 'four_a_chaux' and chemin = 'III - four a chaux p554.JPG';

-- "Le tambour aveugle" : ajoutée au carrousel du point boulevard_du_crime
-- comme une photo classique (l'idée de fiche personnage dédiée est abandonnée).
insert into point_images (point_id, chemin, ordre, banniere, legende, legende_en) values
('boulevard_du_crime', 'camp central - le tambour aveugle_result_result.avif', 3, false,
 'Jean Charraudeau, le tambour aveugle du Camp central, matricule 7 991, et Pierre Massé, matricule 8 277, âgé de quatre-vingt-douze ans en 1911. Album Léon Collin, ANC.',
 'Jean Charraudeau, the blind drummer of Camp Central, prisoner No. 7,991, and Pierre Massé, prisoner No. 8,277, aged ninety-two in 1911. Léon Collin album, ANC.');
