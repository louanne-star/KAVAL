-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : retire une photo du point Léproserie
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

delete from point_images
where point_id = 'leproserie' and chemin = 'cases de la leproserie_result.avif';
