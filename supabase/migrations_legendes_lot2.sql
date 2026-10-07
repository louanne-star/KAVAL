-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : 13 nouvelles légendes de photo
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Mélange de photos de points popup (Ferme Nord/Luzerne, La Vacherie) et de
-- points "vrai" (Briqueterie, Boulangerie, Ateliers, Boulevard du Crime,
-- Logement des surveillants mariés) — la légende en plein écran fonctionne
-- maintenant pour les deux types de point (parcours.page.ts étendu comme
-- map.page.ts). Les textes trop longs pour une légende ont été raccourcis
-- en gardant le fait principal et l'attribution.
-- ─────────────────────────────────────────────────────────────────────────────

-- Points popup

update point_images set legende =
  'La Ferme-Nord en 1914, légende de Léon Mirabel, comptable de l''AP. Collection Marie-Hélène Lafouge.'
where point_id = 'ferme_nord_luzerne' and chemin = 'ferme nord_result_result.avif';

update point_images set legende =
  'La vacherie dans l''anse éponyme à l''île Nou. Construction d''un bassin abreuvoir. Cliché Allan Hughan, State Library of NSW.'
where point_id = 'la_vacherie_ferme' and chemin = 'la vacherie_result.avif';

update point_images set legende =
  'Champs de luzerne à la Ferme-Nord. En 1885, les terrains cultivés représentent près de 50 hectares dont 14 de luzerne. Collection Gaillard, ANC.'
where point_id = 'ferme_nord_luzerne' and chemin = 'champ de luzerne ferme nord_result.avif';

update point_images set legende =
  'La Ferme-Nord circa 1872. Cliché Ernest Robin, album Robin, bibliothèque Bernheim.'
where point_id = 'ferme_nord_luzerne' and chemin = 'ferme nord_result.avif';

update point_images set legende =
  'Cultures à la Ferme-Nord circa 1877. Cliché Allan Hughan, State Library of NSW.'
where point_id = 'ferme_nord_luzerne' and chemin = 'ferme nord2_result.avif';

update point_images set legende =
  'Macé devant son habitation à la Vacherie. « Il habitait une proprette petite maison [...] vivotant du maigre revenu de ces terres », Jacques Dhur. Cliché Théotime Bray, ANOM.'
where point_id = 'la_vacherie_ferme' and chemin = 'mace devant son habitation a la vacherie_result.avif';

update point_images set legende =
  'Le bourreau Rieusset devant sa cabane, à la Vacherie — les derniers bourreaux en fonction logeront sur la colline au-dessus. Collection musée Ernest Cognacq, fonds Ubaud, Saint-Martin-de-Ré.'
where point_id = 'la_vacherie_ferme' and chemin = 'mace devant sa cabane_result.avif';

-- Points "vrai"

update point_images set legende =
  'La briqueterie de l''île Nou : 220 000 briques fabriquées en 1885. On trouve encore des briques marquées « AP », « Île Nou » ou « Koé » (Dumbéa). Album Brun-Dequen, ANC.'
where point_id = 'briqueterie' and chemin = 'briqueterie_result.avif';

update point_images set legende =
  'Vue de la boulangerie vers 1872 : cheminées pas encore rallongées, rampes d''accès pas encore opérationnelles. Au premier plan, le photographe Ernest Robin pose devant un réverbère à poulie. Album Robin, bibliothèque Bernheim.'
where point_id = 'boulangerie' and chemin = 'boulangerie_result.avif';

update point_images set legende =
  'Atelier d''habillement des surveillants militaires. Cliché Théotime Bray, ANOM.'
where point_id = 'ateliers' and chemin = 'atelier1.jpg';

update point_images set legende =
  'Le bâtiment en H des ateliers, avec au premier plan la forge (24,60 m sur 11,20 m) et, dans la cour, la remise abritant la machine principale reliée aux ateliers par un palonnier. Cliché Théotime Bray, ANOM.'
where point_id = 'ateliers' and chemin = 'batiment en H des ateliers_result.avif';

update point_images set legende =
  'Charles Macé et sa guillotine, carte postale. « Monsieur de Nou », exécuteur des hautes œuvres, procéda à 46 exécutions de transportés entre 1877 et 1902. Collection Max Shekleton.'
where point_id = 'boulevard_du_crime' and chemin = 'guillotine_result.avif';

update point_images set legende =
  'Couloir à l''étage de la caserne des surveillants mariés. Les portes, munies de guichets, sont — selon les mots de Carol — « effroyablement verrouillées ». Cliché Dufty, album Nicolas Hagen, ANC.'
where point_id = 'logement_surveillants_militaires_maries' and chemin = 'couloir a la caserne des surveillants maries_result.avif';
