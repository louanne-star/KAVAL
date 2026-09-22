-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : quiz de l'Hôpital du Marais
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- Prérequis : avoir déjà lancé migrations_quiz.sql et migrations_quiz_choix.sql.
--
-- Même principe que le quiz du Camp Est : 5 questions à choix multiples
-- (1 bonne réponse + 2 fausses) pour le point 'hopital_du_marais'.
-- ─────────────────────────────────────────────────────────────────────────────

insert into quiz_questions (point_id, question, bonne_reponse, mauvaise_reponse_1, mauvaise_reponse_2, ordre) values
  ('hopital_du_marais',
   'Quelle était la capacité d''accueil de l''hôpital en 1878 ?',
   '400 lits', '100 lits', '1 000 lits', 1),

  ('hopital_du_marais',
   'Comment luttait-on naturellement contre les mouches dans les salles de soins ?',
   'En suspendant des branches de niaouli', 'En utilisant des pièges à miel', 'En pulvérisant de l''eau salée', 2),

  ('hopital_du_marais',
   'Quel terme sombre le directeur Jules Telle a-t-il utilisé en 1885 pour décrire le quartier des aliénés ?',
   'Un « tombeau à compartiments cellulaires »', 'Un havre de paix', 'Une école de médecine', 3),

  ('hopital_du_marais',
   'Quel élément paysager permettait d''accéder à l''hôpital depuis le pénitencier central ?',
   'Une route bordée d''une allée de cocotiers', 'Un tunnel creusé dans la roche', 'Un passage couvert de pins', 4),

  ('hopital_du_marais',
   'Quel est devenu l''usage du terrain après l''évacuation du cimetière de l''hôpital en 1989 ?',
   'Un parking', 'Un jardin public', 'Un musée du bagne', 5)
on conflict do nothing;
