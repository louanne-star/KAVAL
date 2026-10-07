-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : contenu du point Four à Chaux
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ajoute Histoire + Anecdote (point_sections), le témoignage (temoignages)
-- et les 5 questions de quiz (quiz_questions) pour 'four_a_chaux', qui
-- n'avait jusqu'ici aucun contenu. Textes Histoire/Anecdote/Témoignage
-- repris dans leur version raccourcie fournie par l'utilisateur. Titre du
-- témoignage absent du texte fourni : "Pénurie de chaux et de sable" choisi
-- pour résumer la citation.
-- Tout en fr + en, comme les autres points (voir migrations_points_v2.sql).
-- ─────────────────────────────────────────────────────────────────────────────

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('four_a_chaux', 'Histoire', 'History',
   'Dans les premières années du bagne, la construction était paralysée : l''île Nou ne possédait ni chaux ni sable. Ces matériaux devaient être transportés par chalands depuis la presqu''île Ducos, une navigation périlleuse par vent fort. L''ouverture du four à chaux fin 1870 changea tout, permettant enfin de construire en dur les grands bâtiments du bagne.',
   'In the early years of the penal colony, construction was paralysed: Île Nou had neither lime nor sand. These materials had to be shipped by barge from the Ducos peninsula, a crossing made dangerous by strong winds. The opening of the lime kiln at the end of 1870 changed everything, finally allowing the penal colony''s major buildings to be built in solid stone.',
   1),
  ('four_a_chaux', 'Anecdote', 'Anecdote',
   'Les forçats produisaient de leurs mains enchaînées les matériaux qui servaient à bâtir les murs de leur propre prison.',
   'With their own chained hands, the convicts produced the very materials used to build the walls of their own prison.',
   2)
on conflict (point_id, titre) do update set
  titre_en = excluded.titre_en, texte = excluded.texte, texte_en = excluded.texte_en, ordre = excluded.ordre;

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('four_a_chaux',
   'Pénurie de chaux et de sable', 'Shortage of lime and sand',
   'Archives de l''Administration pénitentiaire', 'Penitentiary Administration archives',
   'Les chantiers se trouvent à court de chaux et de sable faute de moyens rapides de transport. L''île Nou est en effet dépourvue de sable et il faut le transporter par chalands depuis la presqu''île Ducos.',
   'The building sites are running short of lime and sand for lack of fast means of transport. Île Nou has no sand of its own and it must be shipped by barge from the Ducos peninsula.')
on conflict (point_id) do update set
  titre = excluded.titre, titre_en = excluded.titre_en,
  auteur = excluded.auteur, auteur_en = excluded.auteur_en,
  texte = excluded.texte, texte_en = excluded.texte_en;

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('four_a_chaux',
   'Pourquoi manquait-on de chaux à l''île Nou ?', 'Why was there a shortage of lime on Île Nou?',
   'L''île n''en possédait pas et il fallait la transporter.', 'The island had none and it had to be transported in.',
   'Les forçats refusaient de travailler.', 'The convicts refused to work.',
   'Le four était trop petit.', 'The kiln was too small.', 1),

  ('four_a_chaux',
   'Depuis où transportait-on la chaux avant l''ouverture du four ?', 'Where was lime shipped from before the kiln opened?',
   'Depuis la presqu''île Ducos.', 'From the Ducos peninsula.',
   'Depuis Bourail.', 'From Bourail.',
   'Depuis Nouméa.', 'From Nouméa.', 2),

  ('four_a_chaux',
   'En quelle année le four à chaux a-t-il été ouvert ?', 'In what year was the lime kiln opened?',
   'Fin 1870.', 'Late 1870.',
   '1867.', '1867.',
   '1874.', '1874.', 3),

  ('four_a_chaux',
   'Dans quel camp se trouvait le four à chaux ?', 'In which camp was the lime kiln located?',
   'Le Camp Est.', 'East Camp.',
   'Le Camp Central.', 'Central Camp.',
   'La Ferme Nord.', 'North Farm.', 4),

  ('four_a_chaux',
   'Quelle construction a pu débuter dès 1874 grâce au four à chaux ?', 'What construction project was able to begin in 1874 thanks to the lime kiln?',
   'Le camp de la pointe sud, futur Camp Est.', 'The camp at the southern point, later East Camp.',
   'L''hôpital du Marais.', 'The Marais Hospital.',
   'La boulangerie.', 'The bakery.', 5)
on conflict do nothing;
