-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Correctif : doublons dans point_sections + contrainte manquante
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- point_sections n'avait pas de contrainte unique sur (point_id, titre), donc
-- "on conflict do nothing" (utilisé par migrations_point_sections.sql et
-- migrations_briqueterie.sql) ne protégeait contre rien : coller/exécuter un
-- script une deuxième fois insérait une ligne en double (ex: la section
-- "Histoire" de Briqueterie affichée deux fois sur la page détail).
--
-- Ce script supprime les doublons déjà présents (garde une seule ligne par
-- point_id + titre) puis ajoute la contrainte unique. Une fois posée, les
-- futurs "on conflict do nothing" deviendront réellement idempotents : coller
-- un script de contenu plusieurs fois ne créera plus de doublon.
-- ─────────────────────────────────────────────────────────────────────────────

delete from point_sections a
using point_sections b
where a.point_id = b.point_id
  and a.titre = b.titre
  and a.id > b.id;

alter table point_sections
  add constraint point_sections_point_titre_uniq unique (point_id, titre);
