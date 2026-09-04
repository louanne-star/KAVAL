-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : quiz à choix multiples (2 fausses + 1 vraie réponse)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- Prérequis : avoir déjà lancé migrations_quiz.sql une fois.
--
-- Fait évoluer quiz_questions pour stocker 3 choix par question au lieu
-- d'une réponse ouverte. L'app affiche désormais les questions une par une
-- (et non plus toutes en même temps), avec 3 boutons de réponse mélangés
-- aléatoirement à chaque question.
-- ─────────────────────────────────────────────────────────────────────────────

alter table quiz_questions rename column reponse to bonne_reponse;
alter table quiz_questions add column if not exists mauvaise_reponse_1 text;
alter table quiz_questions add column if not exists mauvaise_reponse_2 text;

-- ── Backfill des 2 fausses réponses pour les 5 questions déjà en base ───────
-- ⚠️ Ces fausses réponses sont inventées par Claude pour que le quiz soit
-- jouable tout de suite — relis-les et corrige-les si besoin (Table Editor
-- > quiz_questions), elles ne sont pas garanties historiquement plausibles.

update quiz_questions set
  mauvaise_reponse_1 = 'Au puits du Commandant.',
  mauvaise_reponse_2 = 'À la rivière de la Baie des Dames.'
where point_id = 'camp_est_principal' and ordre = 1;

update quiz_questions set
  mauvaise_reponse_1 = 'Les « incorrigibles ».',
  mauvaise_reponse_2 = 'Les « perpètes ».'
where point_id = 'camp_est_principal' and ordre = 2;

update quiz_questions set
  mauvaise_reponse_1 = 'Un chemin de fer à voie normale.',
  mauvaise_reponse_2 = 'Un tramway à vapeur.'
where point_id = 'camp_est_principal' and ordre = 3;

update quiz_questions set
  mauvaise_reponse_1 = 'En 1889.',
  mauvaise_reponse_2 = 'En 1901.'
where point_id = 'camp_est_principal' and ordre = 4;

update quiz_questions set
  mauvaise_reponse_1 = 'La peine de mort, commuée en réclusion perpétuelle.',
  mauvaise_reponse_2 = 'Six mois de cachot au pain sec.'
where point_id = 'camp_est_principal' and ordre = 5;

alter table quiz_questions alter column mauvaise_reponse_1 set not null;
alter table quiz_questions alter column mauvaise_reponse_2 set not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pour ajouter une nouvelle question ailleurs, il faut désormais fournir les
-- 3 réponses :
--
-- insert into quiz_questions (point_id, question, bonne_reponse, mauvaise_reponse_1, mauvaise_reponse_2, ordre)
-- values ('four_a_chaux', 'La question ?', 'La vraie réponse.', 'Une fausse réponse.', 'Une autre fausse réponse.', 1);
-- ─────────────────────────────────────────────────────────────────────────────
