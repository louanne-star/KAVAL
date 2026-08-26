-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Contenu : le point "Briqueterie"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- Prérequis : migrations_fix_point_sections_doublons.sql (ajoute la
-- contrainte unique (point_id, titre) sur point_sections, sans laquelle le
-- "on conflict" ci-dessous échoue).
--
-- Ajoute la section "Histoire" (page détail, point_sections) et le témoignage
-- d'époque (temoignages) du point briqueterie, sur le même principe que
-- camp_est_principal / hopital_du_marais (voir migrations_point_sections.sql
-- et migrations_temoignages.sql). Recoller ce script ne crée plus de doublon
-- ni n'écrase par erreur : "on conflict ... do update" met juste à jour le
-- contenu si la ligne existe déjà.
--
-- points.description reste inchangé (résumé court affiché sur la petite
-- fiche carte) : ce script n'ajoute que le contenu de la page détail.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Section "Histoire" ───────────────────────────────────────────────────────

insert into point_sections (point_id, titre, texte, ordre) values
  ('briqueterie', 'Histoire',
   'En 1878, une brique importée coûte 250 francs les 1 000, contre seulement 20 francs fabriquée sur place à l''île Nou. Face à cette économie, l''administration fait construire un four à briques malgré l''opposition de M. Joubert, membre civil du Conseil. En 1885, la briqueterie produit 220 000 briques ; on retrouve aujourd''hui encore des briques marquées « AP », « Ile Nou » ou « Koé » (fabriquées à Koé, Dumbéa).',
   1)
on conflict (point_id, titre) do update set
  texte = excluded.texte, ordre = excluded.ordre;

-- ── Témoignage : rapport de l'inspecteur Cabanel (11 octobre 1882) ──────────

insert into temoignages (point_id, titre, auteur, texte) values
  ('briqueterie',
   'Un chantier bien installé',
   'Inspecteur Cabanel, 11 octobre 1882',
   'La briqueterie est très bien installée, en face du jardin de la transportation. Les séchoirs sont très bien. On m''a assuré qu''elle fournissait 60 à 75 000 briques par mois. Il est bien entendu que je donne ce chiffre sous toutes réserves. Il y a un logement convenable pour le surveillant Chevallier qui est chargé de cet important chantier.')
on conflict (point_id) do update set
  titre = excluded.titre, auteur = excluded.auteur, texte = excluded.texte;

-- ── Quiz ──────────────────────────────────────────────────────────────────────
-- Contrainte unique posée d'abord (si pas déjà là) pour que le "on conflict"
-- ci-dessous soit réellement idempotent, comme pour point_sections plus haut.
-- ⚠️ Les fausses réponses sont composées à partir des vrais chiffres/noms du
-- texte pour rester plausibles — relis-les avant publication (cf. migrations_
-- quiz_choix.sql, même remarque faite pour le Camp Est).

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quiz_questions_point_ordre_uniq'
  ) then
    alter table quiz_questions add constraint quiz_questions_point_ordre_uniq unique (point_id, ordre);
  end if;
end $$;

insert into quiz_questions (point_id, question, bonne_reponse, mauvaise_reponse_1, mauvaise_reponse_2, ordre) values
  ('briqueterie',
   'En 1878, combien coûtent les briques fabriquées sur place à l''île Nou, pour 1 000 unités ?',
   '20 francs.', '50 francs.', '250 francs.', 1),

  ('briqueterie',
   'Combien de briques la briqueterie produit-elle en 1885 ?',
   '220 000 briques.', '260 000 briques.', '75 000 briques.', 2),

  ('briqueterie',
   'Qui est le seul membre du Conseil privé à s''opposer à la construction du four à briques ?',
   'M. Joubert.', 'L''inspecteur Cabanel.', 'Le surveillant Chevallier.', 3),

  ('briqueterie',
   'Quelles inscriptions retrouve-t-on aujourd''hui sur certaines briques de l''île Nou ?',
   '« AP », « Ile Nou » ou « Koé ».', '« BAT » ou « Camp Est ».', '« Nouméa » ou « Bagne 1878 ».', 4),

  ('briqueterie',
   'Selon le rapport de l''inspecteur Cabanel (1882), combien de briques la briqueterie fournit-elle chaque mois ?',
   'Entre 60 000 et 75 000 briques.', 'Entre 20 000 et 30 000 briques.', '220 000 briques.', 5)
on conflict (point_id, ordre) do update set
  question = excluded.question, bonne_reponse = excluded.bonne_reponse,
  mauvaise_reponse_1 = excluded.mauvaise_reponse_1, mauvaise_reponse_2 = excluded.mauvaise_reponse_2;
