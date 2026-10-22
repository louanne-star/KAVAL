-- Ajoute les photos (bucket Storage "photos") pour les 9 points qui n'en
-- avaient encore aucune. Noms de fichiers exacts fournis par l'utilisateur
-- (vérifiés un par un via l'API publique de Storage).
--
-- Convention reprise des points déjà illustrés : pour un point à plusieurs
-- photos, la première listée est marquée bannière ; pour un point à une
-- seule photo, le flag n'a pas d'effet (PointsService.banniereDe renvoie
-- toujours l'unique photo), donc banniere = false comme pour les autres
-- points à photo unique (briqueterie, magasin_a_vivre, chateau_eau_tour_guet).

insert into point_images (point_id, chemin, ordre, banniere) values
  -- Logement des surveillants de 1ère classe
  ('logement_surveillants_1ere_classe', '03 La caserne des surveillants de 1ere classe - circa 1910 - coll. Lagarde, ANC.jpg', 1, true),
  ('logement_surveillants_1ere_classe', '04 Les 5 logements de la caserne - coll. LG Viale.jpg', 2, false),

  -- Case des libérés
  ('case_des_liberes', '13 Ile Nou Camp est & cases liberes 61J1-04.jpg', 1, true),
  ('case_des_liberes', 'VII -  Ile Nou Camp est & cases liberes 61J1-04.jpg', 2, false),

  -- Caserne d'infanterie
  ('caserne_infanterie', 'Caserne2.JPG', 1, true),
  ('caserne_infanterie', 'Caserne3.JPG', 2, false),

  -- Bâtiment des officiers d'administration
  ('batiment_officiers_administration', 'I -  Logement de officier administration et ses dependances - circa 1882 - cliche Dufty (detail), ANC.jpg', 1, true),
  ('batiment_officiers_administration', 'I -  Logement de officier administration - coll. ANC.jpg', 2, false),

  -- Four à chaux (photo unique)
  ('four_a_chaux', 'III - four a chaux p554.JPG', 1, false),

  -- Village des libérés (photo unique)
  ('village_des_liberes', 'IX - Ferme nord village liberes WG40-53.jpg', 1, false),

  -- Quartier cellulaire
  ('quartier_cellulaire', 'V -  Quartier Cellulaire IN copie.JPG', 1, true),
  ('quartier_cellulaire', 'V - I Nou quartier celluliaire 2Num27-049 - copie 2.JPG', 2, false),
  ('quartier_cellulaire', 'V - quartier cellulaire (2).jpg', 3, false),
  ('quartier_cellulaire', 'V - quartier cellulaire.JPG', 4, false),

  -- Carrière (photo unique)
  ('carriere', 'VI - Carriere 148Fi36 - 244.jpg', 1, false),

  -- Cimetière des surveillants militaires
  ('cimetiere_surveillants_militaires', 'VIII -  Cimetiere SM I NOU - copie 2.jpg', 1, true),
  ('cimetiere_surveillants_militaires', 'VIII - CIMETIERE DES SURVEILLANTS AU CAMP EST-P214.jpg', 2, false);
