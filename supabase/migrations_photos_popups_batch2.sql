-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos des points popup (lot 2) + légendes
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_photos_popups_batch1.sql, déjà exécutée)
--
-- Les photos ont été ré-uploadées sans accent par l'utilisateur. Note : le
-- fichier "le jardin potager de l'asile des aliénés" a été renommé avec
-- l'apostrophe simplement supprimée (pas remplacée par un espace) :
-- "le jardin potager de lasile des alienes_result.avif".
--
-- "emplacement de la léproserie_result_result.avif" est volontairement
-- exclue de ce lot (demande explicite : retirer cette photo).
-- ─────────────────────────────────────────────────────────────────────────────

insert into point_images (point_id, chemin, ordre, legende) values
  ('leproserie', 'case leproserie_result.avif', 2, null),
  ('leproserie', 'lepreux_result.avif', 3,
   'Lépreux en instance d''embarquement. « [...] celui qui tient le milieu de notre photographie porte sur les mains quelques taches exsangues [...] », D'' Léon Collin, Album Léon Collin, ANC.'),
  ('leproserie', 'transportes lepreux_result.avif', 4,
   'Transportés lépreux à la léproserie de la pointe Kungu.'),

  ('jardin_hopital_logement_surveillant', 'le jardin potager de lasile des alienes_result.avif', 1, null),

  ('parc_a_charbon', 'parc a charbon_result.avif', 2, null)
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;
