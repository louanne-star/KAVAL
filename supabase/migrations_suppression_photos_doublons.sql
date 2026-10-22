-- Supprime deux photos (doublons visuels du même cliché, sous un autre nom)
delete from point_images
where point_id = 'case_des_liberes'
  and chemin = 'VII -  Ile Nou Camp est & cases liberes 61J1-04.jpg';

delete from point_images
where point_id = 'cimetiere_surveillants_militaires'
  and chemin = 'VIII - CIMETIERE DES SURVEILLANTS AU CAMP EST-P214.jpg';
