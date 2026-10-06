-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : marqueur "lieu disparu" pour les points popup
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Certains points popup précisent dans leur description qu'il ne reste plus
-- rien à voir sur place. Plutôt que de parser ce texte côté app, on l'extrait
-- dans un vrai booléen pour piloter le badge "Lieu disparu" de la mini-carte.
-- ─────────────────────────────────────────────────────────────────────────────

alter table points add column if not exists disparu boolean not null default false;

update points set disparu = true
where id in (
  'parc_a_charbon',
  'carriere',
  'cimetiere_surveillants_militaires',
  'case_des_liberes',
  'la_vacherie_ferme',
  'ecole_primaire_surveillants'
);
