-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : Bâtiment des Officiers d'Administration
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ce point n'avait encore aucun contenu (Histoire, Témoignage, Quiz). Ajoute
-- les trois, à partir des infos fournies par l'utilisateur.
-- ─────────────────────────────────────────────────────────────────────────────

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('batiment_officiers_administration', 'Histoire', 'History',
   'Décidé en 1869 par le Conseil privé présidé par le gouverneur Guillain, le pavillon des officiers d''administration est construit vers 1872 : un simple rez-de-chaussée de 22 m sur 9 m, avec véranda et double escalier en pierres. Il loge à l''origine trois officiers, et la déclivité du terrain permet d''aménager en sous-sol une citerne de plusieurs milliers de litres. Après la construction de la nouvelle caserne, il devient le logement de l''officier d''administration et du conducteur des travaux.',
   'Decided in 1869 by the Privy Council chaired by Governor Guillain, the officers'' pavilion was built around 1872: a simple single-storey building 22 m by 9 m, with a veranda and a double stone staircase. It originally housed three officers, and the slope of the land allowed a cistern holding several thousand litres to be built underneath. After the new barracks was built, it became the lodging of the administration officer and the works supervisor.',
   1);

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('batiment_officiers_administration',
   'Deux Officiers Sous un Même Toit', 'Two Officers Under One Roof',
   'Conseil privé, 1869', 'Privy Council, 1869',
   'Le lieutenant et le sous-lieutenant de la compagnie disposent chacun de deux chambres placées dans la largeur du bâtiment. Le logement du capitaine est à l''extrémité nord. Il est séparé de celui du sous-lieutenant par la salle à manger et l''office.',
   'The lieutenant and sub-lieutenant of the company each have two rooms set across the width of the building. The captain''s lodging is at the north end, separated from the sub-lieutenant''s by the dining room and the pantry.');

insert into quiz_questions (point_id, question, question_en, bonne_reponse, bonne_reponse_en, mauvaise_reponse_1, mauvaise_reponse_1_en, mauvaise_reponse_2, mauvaise_reponse_2_en, ordre) values
  ('batiment_officiers_administration',
   'Quand la construction du pavillon a-t-elle été décidée ?', 'When was construction of the pavilion decided?',
   '1869', '1869',
   '1864', '1864',
   '1875', '1875',
   1),

  ('batiment_officiers_administration',
   'Combien d''officiers le bâtiment était-il prévu pour loger ?', 'How many officers was the building meant to house?',
   'Trois', 'Three',
   'Deux', 'Two',
   'Un seul', 'Only one',
   2),

  ('batiment_officiers_administration',
   'Quelle particularité architecturale a permis d''aménager une citerne ?', 'What architectural feature allowed a cistern to be built?',
   'La déclivité du terrain', 'The slope of the land',
   'Le toit en pente', 'The sloped roof',
   'Les fondations en pierre', 'The stone foundations',
   3),

  ('batiment_officiers_administration',
   'Qui présidait le Conseil privé ayant décidé sa construction ?', 'Who chaired the Privy Council that decided its construction?',
   'Le gouverneur Guillain', 'Governor Guillain',
   'Guillain, mais après 1875', 'Guillain, but only after 1875',
   'L''officier d''administration', 'The administration officer',
   4),

  ('batiment_officiers_administration',
   'Quelle était la nouvelle affectation du bâtiment après la caserne ?', 'What was the building''s new use after the barracks was built?',
   'Officier d''administration et conducteur des travaux', 'Administration officer and works supervisor',
   'Hôpital et école', 'Hospital and school',
   'Logement des forçats', 'Convicts'' lodging',
   5)
on conflict do nothing;
