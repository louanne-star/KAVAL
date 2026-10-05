-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Mise à jour des points de la zone Pénitentiaire
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (à exécuter APRÈS migrations_points.sql, migrations_point_sections.sql,
-- migrations_point_images.sql, migrations_briqueterie.sql — qui créent les
-- tables et contraintes utilisées ici — et migrations_i18n_en.sql, qui a
-- ajouté les colonnes _en)
--
-- Ce script :
--  1. Renomme "Logement des surveillants militaires mariés" en "Logement
--     des surveillants mariés" (fr + en) et corrige ses coordonnées GPS
--     (jusqu'ici décalées, faute de vraies données) avec les coordonnées
--     réelles relevées sur Google Maps (CREIPAC at the Bagne - Maison des
--     Surveillants). Ajoute son Histoire, son Anecdote et son quiz (fr + en).
--  2. Crée le nouveau point "La Boulangerie (Manutention)", avec les
--     coordonnées réelles relevées sur Google Maps (BAGNE - BOULANGERIE
--     (ATUPNC)), son Histoire, son Anecdote, son témoignage, son quiz
--     (fr + en), et rattache les 2 photos déjà présentes dans le bucket
--     "photos" (identifiées dans migrations_point_images.sql mais non
--     rattachables jusqu'ici, faute de point existant).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Logement des surveillants mariés (renommage + vraies coordonnées) ───

update points set
  nom = 'Logement des surveillants mariés',
  description = 'Quartiers d''habitation pour les familles des surveillants mariés.',
  nom_en = 'Married guards'' lodging',
  description_en = 'Housing quarters for the families of the guards.',
  lat = -22.26040, lng = 166.40160
where id = 'logement_surveillants_militaires_maries';

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('logement_surveillants_militaires_maries', 'Histoire', 'History',
   'La caserne des surveillants mariés, construite entre 1877 et 1878, offrait 18 logements de deux à trois pièces avec véranda et toit en tuiles. Avant sa construction, le Conseil privé constatait que les surveillants étaient « logés dans des cases en bois et en paille, peu confortables ». Des familles entières vivaient ici — des femmes, des enfants — à quelques mètres seulement des cellules des condamnés. Aujourd''hui, ce bâtiment historique abrite l''IUT de l''Université de la Nouvelle-Calédonie.',
   'The married guards'' barracks, built between 1877 and 1878, offered 18 two- to three-room lodgings with a veranda and tiled roof. Before it was built, the Privy Council noted that guards were "housed in wooden and straw huts, uncomfortable". Whole families lived here — wives, children — just a few metres from the convicts'' cells. Today, this historic building houses the University of New Caledonia''s IUT.',
   1),
  ('logement_surveillants_militaires_maries', 'Anecdote', 'Anecdote',
   'Le bâtiment cellulaire des condamnés à mort donnait directement sur la colline de la caserne. Les portes des cellules étaient, selon le forçat Carol, « effroyablement verrouillées » — pendant que la vie ordinaire continuait juste en face.',
   'The death-row cell block looked directly out onto the barracks'' hill. The cell doors were, according to the convict Carol, "dreadfully bolted" — while ordinary life carried on just across the way.',
   2)
on conflict (point_id, titre) do update set
  titre_en = excluded.titre_en, texte = excluded.texte, texte_en = excluded.texte_en, ordre = excluded.ordre;

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('logement_surveillants_militaires_maries',
   'En quelle année la caserne a-t-elle été construite ?', 'In what year was the barracks built?',
   'Entre 1877 et 1878.', 'Between 1877 and 1878.',
   '1864.', '1864.',
   '1872.', '1872.', 1),

  ('logement_surveillants_militaires_maries',
   'Combien de logements comptait la caserne ?', 'How many lodgings did the barracks have?',
   '18.', '18.',
   '10.', '10.',
   '15.', '15.', 2),

  ('logement_surveillants_militaires_maries',
   'Quel était l''état des logements avant la caserne ?', 'What were the lodgings like before the barracks was built?',
   'Des cases en bois et paille, insuffisantes.', 'Wooden and straw huts, inadequate.',
   'Des maisons en pierre confortables.', 'Comfortable stone houses.',
   'Des tentes provisoires.', 'Temporary tents.', 3),

  ('logement_surveillants_militaires_maries',
   'Quel bâtiment donnait sur la colline de la caserne ?', 'Which building overlooked the barracks'' hill?',
   'Le bâtiment des condamnés à mort.', 'The death-row cell block.',
   'La boulangerie.', 'The bakery.',
   'L''hôpital.', 'The hospital.', 4),

  ('logement_surveillants_militaires_maries',
   'Combien coûtaient les deux casernes au total ?', 'How much did the two barracks cost in total?',
   '91 200 francs.', '91,200 francs.',
   '37 000 francs.', '37,000 francs.',
   '120 000 francs.', '120,000 francs.', 5)
on conflict (point_id, ordre) do update set
  question = excluded.question, question_en = excluded.question_en,
  bonne_reponse = excluded.bonne_reponse, bonne_reponse_en = excluded.bonne_reponse_en,
  mauvaise_reponse_1 = excluded.mauvaise_reponse_1, mauvaise_reponse_1_en = excluded.mauvaise_reponse_1_en,
  mauvaise_reponse_2 = excluded.mauvaise_reponse_2, mauvaise_reponse_2_en = excluded.mauvaise_reponse_2_en;

-- ── 2. Nouveau point : La Boulangerie (Manutention) ─────────────────────────

insert into points (id, zone_id, type, nom, nom_en, description, description_en, lat, lng, rayon, icone, ordre) values
  ('boulangerie', 'penitencier', 'vrai',
   'La Boulangerie (Manutention)', 'The Bakery (Manutention)',
   'L''un des premiers bâtiments en dur du bagne, où le pain était fabriqué pour tous les forçats de l''île.',
   'One of the first permanent buildings of the penal colony, where bread was baked for all the island''s convicts.',
   -22.26171, 166.40316, 20, null, 16)
on conflict (id) do update set
  zone_id = excluded.zone_id, type = excluded.type, nom = excluded.nom, nom_en = excluded.nom_en,
  description = excluded.description, description_en = excluded.description_en,
  lat = excluded.lat, lng = excluded.lng,
  rayon = excluded.rayon, icone = excluded.icone, ordre = excluded.ordre;

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('boulangerie', 'Histoire', 'History',
   'La boulangerie, ou manutention, est l''un des premiers bâtiments en dur du bagne, construit en 1868 sous le gouverneur Guillain, une plaque sur son fronton en témoigne encore. Ses fours à voûtes en briques, renforcés de chaînes d''angle en pierres de taille, produisaient le pain de tous les forçats de l''île. Les condamnés affectés à la boulangerie avaient des horaires différents des autres forçats et ne logeaient pas dans les mêmes cases. En plus du travail de boulangerie, ils devaient débiter une quantité considérable de bois de chauffe pour alimenter les fours.',
   'The bakery, or manutention, is one of the first permanent buildings of the penal colony, built in 1868 under governor Guillain — a plaque on its pediment still attests to it. Its brick-vaulted ovens, reinforced with cut-stone corner chains, produced bread for all the island''s convicts. Convicts assigned to the bakery worked different hours from the other prisoners and did not sleep in the same huts. In addition to the baking work, they had to cut a considerable amount of firewood to fuel the ovens.',
   1),
  ('boulangerie', 'Anecdote', 'Anecdote',
   'En 1872, le photographe Ernest Robin se fit photographier devant l''entrée de la boulangerie, posant fièrement devant un réverbère équipé d''un ingénieux système de poulie servant à descendre le fanal pour l''allumer puis à le remonter. Les cheminées n''étaient pas encore rallongées ; ce n''est que vers 1893 qu''elles furent exhaussées pour éviter d''incommoder les logements alentour.',
   'In 1872, photographer Ernest Robin had his picture taken in front of the bakery''s entrance, posing proudly by a street lamp fitted with a clever pulley system used to lower the lantern for lighting and then raise it again. The chimneys had not yet been heightened; it was only around 1893 that they were raised to stop the smoke from bothering the nearby lodgings.',
   2)
on conflict (point_id, titre) do update set
  titre_en = excluded.titre_en, texte = excluded.texte, texte_en = excluded.texte_en, ordre = excluded.ordre;

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('boulangerie',
   'La boulangerie, un repère de mémoire', 'The bakery, a landmark of memory',
   'Norman de Chastel, petit-fils de Claude Emile Charmier (témoin contemporain)',
   'Norman de Chastel, grandson of Claude Emile Charmier (contemporary witness)',
   '« L''année dernière ce fut Téremba, cette année Nouville, la boulangerie, le presbytère... » Un témoignage fragmentaire qui dit tout : pour ces hommes, les lieux du bagne rythmaient le temps comme d''autres compteraient les saisons.',
   '"Last year it was Téremba, this year Nouville, the bakery, the presbytery..." A fragmentary testimony that says it all: for these men, the places of the penal colony marked time the way others would count the seasons.')
on conflict (point_id) do update set
  titre = excluded.titre, titre_en = excluded.titre_en,
  auteur = excluded.auteur, auteur_en = excluded.auteur_en,
  texte = excluded.texte, texte_en = excluded.texte_en;

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('boulangerie',
   'En quelle année la boulangerie a-t-elle été construite ?', 'In what year was the bakery built?',
   '1868.', '1868.',
   '1864.', '1864.',
   '1871.', '1871.', 1),

  ('boulangerie',
   'Quel gouverneur a ordonné sa construction ?', 'Which governor ordered its construction?',
   'Guillain.', 'Guillain.',
   'Olry.', 'Olry.',
   'Bonard.', 'Bonard.', 2),

  ('boulangerie',
   'Pourquoi les forçats de la boulangerie ne logeaient-ils pas avec les autres ?', 'Why didn''t the bakery''s convicts live with the others?',
   'Ils avaient des horaires différents.', 'They worked different hours.',
   'Ils bénéficiaient d''un traitement de faveur.', 'They received favourable treatment.',
   'Ils étaient trop nombreux.', 'There were too many of them.', 3),

  ('boulangerie',
   'À quoi servaient les cheminées rallongées vers 1893 ?', 'What were the chimneys heightened for, around 1893?',
   'Éviter d''incommoder les logements alentour.', 'To stop the smoke from bothering nearby lodgings.',
   'Améliorer le tirage des fours.', 'To improve the ovens'' draught.',
   'Signaler la boulangerie de loin.', 'To signal the bakery from afar.', 4),

  ('boulangerie',
   'Quel travail supplémentaire les forçats de la boulangerie devaient-ils effectuer ?', 'What extra work did the bakery''s convicts have to do?',
   'Débiter du bois de chauffe pour les fours.', 'Cut firewood for the ovens.',
   'Fabriquer des chapeaux de paille.', 'Make straw hats.',
   'Livrer le pain dans tout le bagne.', 'Deliver bread throughout the penal colony.', 5)
on conflict (point_id, ordre) do update set
  question = excluded.question, question_en = excluded.question_en,
  bonne_reponse = excluded.bonne_reponse, bonne_reponse_en = excluded.bonne_reponse_en,
  mauvaise_reponse_1 = excluded.mauvaise_reponse_1, mauvaise_reponse_1_en = excluded.mauvaise_reponse_1_en,
  mauvaise_reponse_2 = excluded.mauvaise_reponse_2, mauvaise_reponse_2_en = excluded.mauvaise_reponse_2_en;

-- Contrainte manquante sur point_images (comme pour point_sections, voir
-- migrations_fix_point_sections_doublons.sql) : sans elle, "on conflict"
-- ne détecte rien et recoller ce script créerait des photos en double.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'point_images_point_chemin_uniq'
  ) then
    alter table point_images add constraint point_images_point_chemin_uniq unique (point_id, chemin);
  end if;
end $$;

insert into point_images (point_id, chemin, ordre) values
  ('boulangerie', 'boulangerie_result.avif',  1),
  ('boulangerie', 'boulangerie2_result.avif', 2)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;
