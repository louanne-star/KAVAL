-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Contenu : le point "Briqueterie"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ajoute la section "Histoire" (page détail, point_sections) et le témoignage
-- d'époque (temoignages) du point briqueterie, sur le même principe que
-- camp_est_principal / hopital_du_marais (voir migrations_point_sections.sql
-- et migrations_temoignages.sql).
--
-- points.description reste inchangé (résumé court affiché sur la petite
-- fiche carte) : ce script n'ajoute que le contenu de la page détail.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Section "Histoire" ───────────────────────────────────────────────────────

insert into point_sections (point_id, titre, texte, ordre) values
  ('briqueterie', 'Histoire',
   'En 1878, les briques importées coûtent 250 francs les 1 000, contre 50 francs pour celles achetées sur place et seulement 20 francs pour celles fabriquées directement à l''île Nou. Entre 1877 et le premier semestre 1878, 260 000 briques sont achetées, pour une économie estimée à 7 800 francs si elles avaient été produites sur place. L''administration décide alors de construire un four à briques, pour une dépense de 4 100 francs réduite grâce aux 3 170 francs de briques réfractaires déjà en magasin. Seul M. Joubert, membre civil du Conseil privé, s''oppose au projet, estimant qu''il « portera un coup fatal à l''industrie du pays ». En 1885, la briqueterie produit 220 000 briques ; on retrouve aujourd''hui encore des briques marquées « AP », « Ile Nou » ou « Koé » (fabriquées à Koé, Dumbéa).',
   1)
on conflict do nothing;

-- ── Témoignage : rapport de l'inspecteur Cabanel (11 octobre 1882) ──────────

insert into temoignages (point_id, titre, auteur, texte) values
  ('briqueterie',
   'Un chantier bien installé',
   'Inspecteur Cabanel, 11 octobre 1882',
   'La briqueterie est très bien installée, en face du jardin de la transportation. Les séchoirs sont très bien. On m''a assuré qu''elle fournissait 60 à 75 000 briques par mois. Il est bien entendu que je donne ce chiffre sous toutes réserves. Il y a un logement convenable pour le surveillant Chevallier qui est chargé de cet important chantier.')
on conflict (point_id) do update set
  titre = excluded.titre, auteur = excluded.auteur, texte = excluded.texte;
