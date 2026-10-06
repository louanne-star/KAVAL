-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Mise à jour des points de la zone Pénitentiaire (v3)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (à exécuter APRÈS migrations_points.sql, migrations_point_sections.sql,
-- migrations_point_images.sql, migrations_i18n_en.sql, migrations_points_v2.sql)
--
-- Ce script :
--  1. Corrige les coordonnées GPS du point popup "École primaire des enfants
--     des surveillants" et du point "Hôpital du Marais" (jusqu'ici
--     approximatives).
--  2. Crée le nouveau point "Les Ateliers de l'Île Nou" (bâtiment en H),
--     avec son Histoire, son Anecdote, son témoignage, son quiz (fr + en),
--     et rattache les 3 photos déjà présentes dans le bucket "photos"
--     (identifiées dans migrations_point_images.sql comme "Bâtiment H
--     atelier", non rattachables jusqu'ici faute de point existant).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. École primaire des enfants des surveillants (vraies coordonnées) ─────
-- 22°15'42.7"S 166°24'13.2"E

update points set lat = -22.261861, lng = 166.403667
where id = 'ecole_primaire_surveillants';

-- ── 1bis. Hôpital du Marais (vraies coordonnées) ────────────────────────────
-- 22°15'59.4"S 166°23'51.2"E

update points set lat = -22.266500, lng = 166.397556
where id = 'hopital_du_marais';

-- ── 1ter. Magasin à vivre / Théâtre de l'Île (vraies coordonnées) ──────────
-- 22°15'42.7"S 166°24'03.6"E

update points set lat = -22.261861, lng = 166.401000
where id = 'magasin_a_vivre';

-- ── 2. Nouveau point : Les Ateliers de l'Île Nou ────────────────────────────
-- 22°15'39.7"S 166°24'08.0"E

insert into points (id, zone_id, type, nom, nom_en, description, description_en, lat, lng, rayon, icone, ordre) values
  ('ateliers', 'penitencier', 'vrai',
   'Les Ateliers de l''Île Nou', 'The Île Nou Workshops',
   'Le cœur économique du bagne : tailleurs, cordonniers, charrons et forgerons y travaillaient comme « ouvriers d''art ».',
   'The economic heart of the penal colony: tailors, shoemakers, cartwrights and blacksmiths worked here as "skilled craftsmen".',
   -22.261028, 166.402222, 20, null, 17)
on conflict (id) do update set
  zone_id = excluded.zone_id, type = excluded.type, nom = excluded.nom, nom_en = excluded.nom_en,
  description = excluded.description, description_en = excluded.description_en,
  lat = excluded.lat, lng = excluded.lng,
  rayon = excluded.rayon, icone = excluded.icone, ordre = excluded.ordre;

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('ateliers', 'Histoire', 'History',
   'Le bâtiment en H des ateliers, terminé vers 1878, était le cœur économique du bagne. Trois corps de bâtiment imposants abritaient tailleurs, cordonniers, charrons, forgerons et matelassiers — des forçats classés "ouvriers d''art" et bénéficiant d''un traitement plus favorable que les autres condamnés. Les chiffres donnent le vertige : en 1876 seulement, 90 tailleurs confectionnaient 12 500 chemises et 13 600 pantalons, 73 cordonniers produisaient 15 000 paires de chaussures, et 90 condamnés impotents tressaient 10 000 chapeaux de paille. En 1877, 18 matelassiers fabriquaient près de 3 000 hamacs.',
   'The H-shaped workshop building, completed around 1878, was the economic heart of the penal colony. Three imposing wings housed tailors, shoemakers, cartwrights, blacksmiths and mattress-makers — convicts classed as "skilled craftsmen" who received more favourable treatment than other prisoners. The figures are staggering: in 1876 alone, 90 tailors made 12,500 shirts and 13,600 trousers, 73 shoemakers produced 15,000 pairs of shoes, and 90 disabled convicts plaited 10,000 straw hats. In 1877, 18 mattress-makers made nearly 3,000 hammocks.',
   1),
  ('ateliers', 'Anecdote', 'Anecdote',
   'Parmi les charrons travaillant aux ateliers, un condamné surnommé "la Chique" — ancien charretier originaire de Laon — conduisait fièrement les voitures et tombereaux fabriqués sur place. En 1890, les ateliers furent contraints de fermer sur ordre ministériel : les entrepreneurs et agriculteurs de la colonie se plaignaient d''une concurrence déloyale de la main-d''œuvre forcée.',
   'Among the cartwrights working at the workshops, a convict nicknamed "la Chique" — a former carter from Laon — proudly drove the carts and tip-carts built on site. In 1890, the workshops were forced to close by ministerial order: the colony''s contractors and farmers had complained of unfair competition from forced labour.',
   2)
on conflict (point_id, titre) do update set
  titre_en = excluded.titre_en, texte = excluded.texte, texte_en = excluded.texte_en, ordre = excluded.ordre;

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('ateliers',
   'Les « ouvriers d''art » des ateliers', 'The workshops'' "skilled craftsmen"',
   'Source : Livre 1, bagne de Nouvelle-Calédonie', 'Source: Book 1, Bagne de Nouvelle-Calédonie',
   '« Les forçats qui travaillent aux ateliers sont classés comme ''ouvriers d''art'' et bénéficient d''un traitement plus favorable. »',
   '"The convicts working at the workshops are classed as ''skilled craftsmen'' and receive more favourable treatment."')
on conflict (point_id) do update set
  titre = excluded.titre, titre_en = excluded.titre_en,
  auteur = excluded.auteur, auteur_en = excluded.auteur_en,
  texte = excluded.texte, texte_en = excluded.texte_en;

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('ateliers',
   'Vers quelle année le bâtiment en H des ateliers a-t-il été terminé ?', 'Around what year was the H-shaped workshop building completed?',
   '1878.', '1878.',
   '1864.', '1864.',
   '1871.', '1871.', 1),

  ('ateliers',
   'Comment étaient appelés les forçats affectés aux ateliers ?', 'What were the convicts assigned to the workshops called?',
   'Ouvriers d''art.', 'Skilled craftsmen.',
   'Forçats de corvée.', 'Chain-gang convicts.',
   'Transportés spéciaux.', 'Special transportees.', 2),

  ('ateliers',
   'Combien de paires de chaussures les cordonniers produisaient-ils en 1876 ?', 'How many pairs of shoes did the shoemakers produce in 1876?',
   '15 000.', '15,000.',
   '5 000.', '5,000.',
   '20 000.', '20,000.', 3),

  ('ateliers',
   'Pourquoi les ateliers ont-ils été fermés en 1890 ?', 'Why were the workshops closed in 1890?',
   'Concurrence déloyale dénoncée par les entrepreneurs locaux.', 'Unfair competition denounced by local contractors.',
   'Manque de matières premières.', 'Shortage of raw materials.',
   'Révolte des forçats.', 'A convict uprising.', 4),

  ('ateliers',
   'Combien de chapeaux de paille les condamnés impotents tressaient-ils en 1876 ?', 'How many straw hats did the disabled convicts plait in 1876?',
   '10 000.', '10,000.',
   '8 000.', '8,000.',
   '15 000.', '15,000.', 5)
on conflict (point_id, ordre) do update set
  question = excluded.question, question_en = excluded.question_en,
  bonne_reponse = excluded.bonne_reponse, bonne_reponse_en = excluded.bonne_reponse_en,
  mauvaise_reponse_1 = excluded.mauvaise_reponse_1, mauvaise_reponse_1_en = excluded.mauvaise_reponse_1_en,
  mauvaise_reponse_2 = excluded.mauvaise_reponse_2, mauvaise_reponse_2_en = excluded.mauvaise_reponse_2_en;

-- Contrainte manquante sur point_images (voir migrations_points_v2.sql) :
-- idempotent, ne fait rien si déjà posée.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'point_images_point_chemin_uniq'
  ) then
    alter table point_images add constraint point_images_point_chemin_uniq unique (point_id, chemin);
  end if;
end $$;

insert into point_images (point_id, chemin, ordre) values
  ('ateliers', 'batiment en H des ateliers_result.avif', 1),
  ('ateliers', 'batiment H_result.avif',                 2),
  ('ateliers', 'atelier1.jpg',                            3)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre;

delete from point_images
where point_id = 'ateliers' and chemin = 'IMG_4818_result_result.avif';
