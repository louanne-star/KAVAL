-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Contenu : ajustement du point "Briqueterie"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- Prérequis : avoir lancé migrations_fix_point_sections_doublons.sql avant
-- celui-ci (sinon les deux lignes "Histoire" en double seraient mises à jour
-- au lieu d'une seule).
--
-- 1. Raccourcit la section "Histoire" : le texte d'origine (migrations_
--    briqueterie.sql) était trop long pour tenir confortablement sur mobile.
-- 2. Remplace le témoignage par la citation de M. Joubert (à la place du
--    rapport de l'inspecteur Cabanel).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Histoire : version raccourcie ────────────────────────────────────────────

update point_sections
set texte = 'En 1878, une brique importée coûte 250 francs les 1 000, contre seulement 20 francs fabriquée sur place à l''île Nou. Face à cette économie, l''administration fait construire un four à briques malgré l''opposition de M. Joubert, membre civil du Conseil. En 1885, la briqueterie produit 220 000 briques ; on retrouve aujourd''hui encore des briques marquées « AP », « Ile Nou » ou « Koé » (fabriquées à Koé, Dumbéa).'
where point_id = 'briqueterie' and titre = 'Histoire';

-- ── Témoignage : citation de M. Joubert ──────────────────────────────────────

update temoignages
set titre  = 'Un coup fatal à l''industrie du pays',
    auteur = 'M. Joubert, membre civil du Conseil privé',
    texte  = 'Ce projet portera un coup fatal à l''industrie du pays.'
where point_id = 'briqueterie';
