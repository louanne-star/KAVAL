-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Mise à jour du contenu du jeu "Le Tribunal du Bagne"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (à exécuter APRÈS migrations_tribunal.sql, qui a créé la table)
--
-- Ce script :
--  1. Autorise l'âge à être vide (on ne connaît pas l'âge exact de ces
--     personnes réelles, contrairement aux dossiers fictifs d'origine).
--  2. Supprime les 8 dossiers fictifs de départ.
--  3. Insère 5 dossiers de vrais bagnards de l'île Nou (2 déportés,
--     1 transporté, 2 relégués), enrichis à partir des panneaux
--     généalogiques des familles descendantes, avec leur portrait
--     (bucket Storage public "tribunal").
-- ─────────────────────────────────────────────────────────────────────────────

alter table tribunal_dossiers alter column age drop not null;

delete from tribunal_dossiers;

insert into tribunal_dossiers (matricule, nom, age, accusation, bonne_reponse, explication, photo) values

  ('#8001', 'Théophile Cacot', null,
   'Jeune homme instruit et fervent républicain, il s''oppose à l''Empire et prend part à la Commune de Paris en 1871.',
   'DEPORTÉ',
   'Les communards étaient jugés pour un crime politique contre l''État : Théophile Cacot fut déporté en 1872. Relevé de sa peine sous résidence obligatoire, il fait partie des rares communards à s''être établis définitivement en Nouvelle-Calédonie.',
   'theophile-cacot.png'),

  ('#8002', 'Ca-Lê Ngoc Lien', null,
   'Photographe de métier, il se révolte contre la France pour réclamer l''indépendance du Viêt Nam, son pays natal devenu l''Indochine française.',
   'DEPORTÉ',
   'La révolte anticoloniale était jugée comme un crime politique contre l''État : Ca-Lê Ngoc Lien fut déporté en Nouvelle-Calédonie en 1914 et ne reverra jamais son Tonkin natal. Il refera sa vie à Nouméa comme photographe.',
   'ca-le-ngoc-lien.png'),

  ('#8003', 'Antoine Berezowski', null,
   'Polonais originaire de Volhynie, il est condamné en 1867 pour « tentative d''homicide volontaire avec préméditation sur la personne de S.M. l''empereur de Russie ».',
   'TRANSPORTÉ',
   'Commis sur le sol français contre un chef d''État étranger et non contre la France elle-même, l''attentat fut jugé comme un crime de droit commun : Antoine Berezowski fut transporté à perpétuité en Nouvelle-Calédonie en 1868, non déporté. Il finira ses jours à l''île Nou en 1916.',
   'antoine-berezowski.png'),

  ('#8004', 'Marie Paillard', null,
   'Condamnée aux travaux forcés pour vol, elle arrive au bagne en 1881.',
   'RELÉGUÉ',
   'De nombreuses femmes condamnées pour vol étaient reléguées aux colonies, une mesure d''éloignement visant en particulier les récidivistes les plus démunies. Marie Paillard refera sa vie du nord au sud de la Grande Terre.',
   'marie-paillard.png'),

  ('#8005', 'Pierre Chenevier', null,
   'Grand voleur, après plusieurs démêlés avec la justice, il est condamné à dix ans de travaux forcés.',
   'RELÉGUÉ',
   'À peine libre, Pierre Chenevier connaît un deuxième séjour au bagne, puis un troisième : la récidive répétée de vols entraînait la relégation, une mesure d''éloignement définitif des multirécidivistes.',
   'pierre-chenevier.png')

on conflict do nothing;
