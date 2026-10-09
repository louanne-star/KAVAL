-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : Logement du Surveillant Principal
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Raccourcit la section Histoire, ajoute un Témoignage (ce point n'en avait
-- pas encore) et remplace les 5 questions de quiz par la nouvelle version.
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'Validé le 8 août 1882 et construit en 1882-1883, le logement du surveillant principal se dresse au bord du quai, au centre de l''île. Trois pièces de 5 m sur 5, une véranda avant et arrière, une citerne de 70 000 litres, une cave et un kiosque à six pans. Côté mer, deux pavillons en maçonnerie le protègent des gros temps, le tout pour 5 500 francs, cuisine et latrines comprises. À titre de comparaison, le seul mur d''enceinte de l''hôpital du Marais coûtera 17 000 francs. Il deviendra infirmerie dans les années 1950-1960, puis sera occupé par le CREIPAC.',
  texte_en =
    'Approved on 8 August 1882 and built in 1882-1883, the head guard''s residence stands at the edge of the quay, at the centre of the island. Three rooms of 5 m by 5 m, a verandah at the front and back, a 70,000-litre cistern, a cellar and a six-sided kiosk. On the seaward side, two masonry pavilions protect it from rough weather, all for 5,500 francs, including the kitchen and latrines. For comparison, the perimeter wall alone at the Hôpital du Marais will cost 17,000 francs. It later becomes an infirmary in the 1950s-1960s, then is occupied by CREIPAC.'
where id = '7ba2c758-9c82-426c-beb4-6877995feee0';

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('logement_surveillant_principal',
   'Les familles du magasin des vivres',
   'The families of the provisions store',
   'Collection Marie-Hélène Lafouge',
   'Marie-Hélène Lafouge collection',
   '« Les familles du surveillant Albert Pérault et du gendarme Montané devant les logements du magasin des vivres. Un escalier permettait alors d''accéder à la véranda des logements ; le tout est aujourd''hui de plain-pied. »',
   '"The families of guard Albert Pérault and gendarme Montané, outside the provisions-store lodgings. A staircase once led up to the lodgings'' verandah; today it is all on one level."')
on conflict (point_id) do update set
  titre = excluded.titre, titre_en = excluded.titre_en,
  auteur = excluded.auteur, auteur_en = excluded.auteur_en,
  texte = excluded.texte, texte_en = excluded.texte_en;

delete from quiz_questions where point_id = 'logement_surveillant_principal';

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('logement_surveillant_principal',
   'Quand ce logement a-t-il été validé ?', 'When was this residence approved?',
   '8 août 1882', '8 August 1882',
   '1875', '1875',
   '1890', '1890',
   1),

  ('logement_surveillant_principal',
   'Quelle est la capacité de la citerne ?', 'What is the cistern''s capacity?',
   '70 000 L', '70,000 L',
   '10 000 L', '10,000 L',
   '30 000 L', '30,000 L',
   2),

  ('logement_surveillant_principal',
   'Quel était le coût total prévu ?', 'What was the planned total cost?',
   '5 500 francs', '5,500 francs',
   '17 000 francs', '17,000 francs',
   '91 200 francs', '91,200 francs',
   3),

  ('logement_surveillant_principal',
   'Où se situait ce logement ?', 'Where was this residence located?',
   'Au bord du quai, au centre', 'At the edge of the quay, at the centre',
   'Près de la carrière', 'Near the quarry',
   'Près de l''hôpital', 'Near the hospital',
   4),

  ('logement_surveillant_principal',
   'Quelle fonction a eu le bâtiment dans les années 1950-1960 ?', 'What function did the building serve in the 1950s-1960s?',
   'Infirmerie', 'Infirmary',
   'École', 'School',
   'Chapelle', 'Chapel',
   5)
on conflict do nothing;
