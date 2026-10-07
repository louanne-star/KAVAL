-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : 14 dernières légendes de photo
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Complète la couverture des légendes sur Magasin à vivre, Chapelle
-- Saint-Thomas, Logement du surveillant principal, Logement des surveillants
-- mariés, Boulevard du Crime, Hôpital du Marais, Boulangerie et Ateliers.
-- Les textes trop longs ont été raccourcis en gardant le fait principal et
-- l'attribution ; quelques coquilles évidentes corrigées (accents, "maries"
-- -> "mariés", "Cognaca" -> "Cognacq", "toles" -> "tôles"...).
-- ─────────────────────────────────────────────────────────────────────────────

update point_images set legende =
  'Magasin des vivres, logement et bureaux du comptable, aile ouest. Album Leloup, collection Kakou, ANC.'
where point_id = 'magasin_a_vivre' and chemin = 'magasin des vivres_result.avif';

update point_images set legende =
  'La chapelle Saint-Thomas vers 1893, avec son clocher en briques de près de 9 m, dans le style caractéristique de la Pénitentiaire. Cliché Théotime Bray, ANOM.'
where point_id = 'chapelle_saint_thomas' and chemin = 'chapelle_result.avif';

update point_images set legende =
  'Logement du surveillant principal. Cliché Théotime Bray, ANOM.'
where point_id = 'logement_surveillant_principal' and chemin = 'logement du surveillant principal_result_result.avif';

update point_images set legende =
  'Construite entre 1877 et 1878, la caserne des surveillants mariés (toit à clocheton) est surélevée : caves et citernes en soubassement, vérandah à l''avant. Cliché Théotime Bray, ANOM.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'caserne des suveillants maries_result.avif';

update point_images set legende =
  'Au premier plan, deux gardes indigènes en veste galonnée, devant la caserne des surveillants mariés, au balcon de laquelle posent des familles. Collection Louis Lagarde, ANC.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'garde indigenes devant la caserne des suveillants maries_result.avif';

update point_images set legende =
  'La caserne des surveillants mariés et ses dépendances. Collection musée Ernest Cognacq, fonds Ubaud, Saint-Martin-de-Ré.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'la caserne des surveillants maries_result.avif';

update point_images set legende =
  'À l''arrière, dans une cour commune, deux dépendances en maçonnerie couvertes de tôles, de 26 m de long sur 6 m de large, abritent les cuisines. Cliché Théotime Bray, ANOM.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'la caserne des surveillants maries2_result.avif';

update point_images set legende =
  'Petite caserne des surveillants mariés à l''île Nou, circa 1893, côté rade et Ducos : sous les flamboyants, des familles de surveillants (dont les Bray) posent. Logements parmi les plus anciens du pénitencier, utilisés jusqu''à la fin du bagne. Cliché Théotime Bray, ANOM.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'petite caserne des surveillant maries_result_result.avif';

update point_images set legende =
  'Le Camp central, circa 1872 : les forçats au sortir de leurs cases, avant la corvée. « Les cases du pénitencier sont bâties de pierres [...] rendues plus tristes encore par les énormes barreaux [...] », Alexis Trinquet. Cliché Ernest Robin, bibliothèque Bernheim.'
where point_id = 'boulevard_du_crime' and chemin = 'camp central_result.avif';

update point_images set legende =
  'Le cimetière de l''hôpital à l''île Nou, définitivement évacué en 1989 et remplacé par un parking. Collection musée Ernest Cognacq, fonds Ubaud, Saint-Martin-de-Ré.'
where point_id = 'hopital_du_marais' and chemin = 'cimetiere de l''hopital_result_result.avif';

update point_images set legende =
  'Le mur d''enceinte et la buanderie vus de l''extérieur de l''hôpital ; en arrière-plan, l''emplacement d''une des carrières ayant servi à sa construction. Cliché Théotime, collection Kakou, ANC.'
where point_id = 'hopital_du_marais' and chemin = 'hopital du marais extension_result_result.avif';

update point_images set legende =
  'Les jardins de l''hôpital. Au centre, la mare artificielle circulaire où, enfant, Albert Ubaud allait pêcher des anguilles. Album Brun-Bourguet, ANC.'
where point_id = 'hopital_du_marais' and chemin = 'jardin de l''hopital du marais_result.avif';

update point_images set legende =
  'La boulangerie vers 1893, cheminées désormais rallongées. Devant l''entrée : le distributeur, un employé civil, et un forçat écrivain tenant le registre des comptes. Cliché Théotime Bray, ANOM.'
where point_id = 'boulangerie' and chemin = 'boulangerie2_result.avif';

update point_images set legende =
  'Le bâtiment en H des ateliers, façade nord-ouest. Cliché Théotime Bray, ANOM.'
where point_id = 'ateliers' and chemin = 'batiment H_result.avif';
