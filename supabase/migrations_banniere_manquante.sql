-- Ces points ont plusieurs photos mais aucune n'est marquée "bannière" :
-- l'appli n'affiche donc rien tant que ce choix n'est pas fait (voir
-- PointsService.banniereDe). On marque la photo d'origine comme bannière.

update point_images set banniere = true
where point_id = 'magasin_a_vivre' and chemin = 'magasin-des-vivres_result.avif';

update point_images set banniere = true
where point_id = 'village_des_liberes' and chemin = 'IX - Ferme nord village liberes WG40-53.jpg';
