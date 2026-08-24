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

-- ── Témoignage : citation de M. Joubert ──────────────────────────────────────

insert into temoignages (point_id, titre, auteur, texte) values
  ('briqueterie',
   'Un coup fatal à l''industrie du pays',
   'M. Joubert, membre civil du Conseil privé',
   'Ce projet portera un coup fatal à l''industrie du pays.')
on conflict (point_id) do update set
  titre = excluded.titre, auteur = excluded.auteur, texte = excluded.texte;
