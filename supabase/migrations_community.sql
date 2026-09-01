-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration communauté (à coller APRÈS migrations.sql)
-- Supabase Dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Ajoute les initiales dans les commentaires ─────────────────────────────
alter table user_comments add column if not exists initiales text default '?';

-- ── 2. Lecture des notes par tous (pour calculer la moyenne) ─────────────────
--    La politique "FOR ALL" actuelle bloque la lecture aux autres users.
--    On ajoute une politique SELECT permissive qui autorise tout utilisateur
--    connecté à lire TOUTES les notes (nécessaire pour la moyenne).
create policy "Lecture notes communauté"
  on user_ratings for select
  to authenticated
  using (true);

-- ── 3. Lecture des commentaires par tous (vue communauté) ────────────────────
create policy "Lecture commentaires communauté"
  on user_comments for select
  to authenticated
  using (true);
