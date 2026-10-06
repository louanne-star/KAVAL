-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : badge "Vestiges visibles" pour les points popup
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_points_disparus.sql, déjà exécutée)
--
-- Sur les 10 points popup, 6 ont déjà le badge "Lieu disparu" (colonne
-- `disparu`). Les 4 restants ont encore des vestiges visibles sur place
-- (contrairement à "disparu", leur description ne dit pas explicitement que
-- le site a disparu) : on leur ajoute un 2e badge, de couleur différente,
-- pour que l'état du lieu soit toujours lisible d'un coup d'œil.
-- ─────────────────────────────────────────────────────────────────────────────

alter table points add column if not exists vestiges boolean not null default false;

update points set vestiges = true
where id in (
  'jardin_hopital_logement_surveillant',
  'ferme_nord_luzerne',
  'village_des_liberes',
  'leproserie'
);
