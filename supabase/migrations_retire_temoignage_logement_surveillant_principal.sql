-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : retire le témoignage du Logement du
-- Surveillant Principal
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Le témoignage ajouté par migrations_logement_surveillant_principal_v2.sql
-- parlait en fait des logements du magasin des vivres, pas de ce point —
-- retiré. La carte "Témoignage" ne s'affiche plus sur ce point tant
-- qu'aucune ligne n'existe dans temoignages pour lui.
-- ─────────────────────────────────────────────────────────────────────────────

delete from temoignages where point_id = 'logement_surveillant_principal';
