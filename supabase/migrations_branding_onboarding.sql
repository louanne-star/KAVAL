-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : fond d'écran de l'onboarding (branding)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_branding.sql, déjà exécutée — même bucket "branding",
-- déjà créé et public)
--
-- Ajoute la clé "fond_onboarding" : l'image affichée en fond des écrans 1 et
-- 5 de l'onboarding (accueil et écran final), à la place de la photo
-- actuellement codée en dur (assets/apropos/img.jpg). Même principe que le
-- logo : tant que le fichier n'est pas uploadé ou que Supabase est
-- injoignable, l'app retombe automatiquement sur cette photo locale.
--
-- Fichier attendu dans le bucket "branding" (à uploader manuellement) :
--   fond-onboarding.png — illustration carte d'île (celle fournie)
-- ─────────────────────────────────────────────────────────────────────────────

insert into app_branding (cle, chemin) values
  ('fond_onboarding', 'fond-onboarding.png')
on conflict (cle) do update set chemin = excluded.chemin;
