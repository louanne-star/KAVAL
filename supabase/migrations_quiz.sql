-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : quiz par point
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Table du quiz affiché sur la page détail d'un point (comme pour les
-- témoignages : lecture publique, chargée au démarrage et mise en cache
-- localement). Pour ajouter/modifier une question plus tard : édite
-- directement les lignes dans Table Editor > quiz_questions, aucun
-- redéploiement de l'app n'est nécessaire.
--
-- point_id doit correspondre à l'id d'un point de type 'vrai' (table
-- points) : c'est sur la page détail de ce point que la question
-- s'affichera. Un point sans ligne ici n'affiche simplement pas la carte
-- "Quiz". `ordre` contrôle l'ordre d'affichage des questions.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists quiz_questions (
  id       uuid primary key default gen_random_uuid(),
  point_id text not null references points(id),
  question text not null,
  reponse  text not null,
  ordre    int  not null default 0
);

alter table quiz_questions enable row level security;

drop policy if exists "Lecture publique du quiz" on quiz_questions;
create policy "Lecture publique du quiz"
  on quiz_questions for select
  using (true);

-- ── Seed : quiz du Camp Est ─────────────────────────────────────────────────

insert into quiz_questions (point_id, question, reponse, ordre) values
  ('camp_est_principal',
   'Où les condamnés du Camp Est doivent-ils aller chercher de l''eau potable, faute de pouvoir boire celle du camp ?',
   'À la Fontaine Bigard.', 1),

  ('camp_est_principal',
   'Comment sont surnommés, dans l''argot du bagne, les condamnés à perpétuité placés au quartier disciplinaire du Camp Est ?',
   'Les « berlingots ».', 2),

  ('camp_est_principal',
   'Quel petit chemin de fer relie le hangar à charbon à la jetée d''embarquement ?',
   'Un chemin de fer Decauville.', 3),

  ('camp_est_principal',
   'En quelle année Raoul Tellier tente-t-il sa 12e évasion depuis le Camp Est ?',
   'En 1897 (le 7 octobre).', 4),

  ('camp_est_principal',
   'Quelle punition Tellier reçoit-il pour cette tentative d''évasion ratée ?',
   'Quatre ans de travaux forcés supplémentaires, prononcés par le Tribunal maritime spécial.', 5)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pour ajouter un quiz à un autre point, insère simplement de nouvelles
-- lignes, par exemple :
--
-- insert into quiz_questions (point_id, question, reponse, ordre) values
--   ('four_a_chaux', 'La question ?', 'La réponse.', 1);
-- ─────────────────────────────────────────────────────────────────────────────
