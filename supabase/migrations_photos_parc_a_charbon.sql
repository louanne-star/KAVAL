-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : refonte des photos du point Parc à charbon
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_photos_popups_batch2.sql, déjà exécutée)
--
-- "662A19A8-...avif" est en fait un scan de page de livre montrant les 2
-- nouvelles photos ci-dessous avec leurs légendes imprimées — retirée,
-- remplacée par les 2 vraies photos d'archive avec leur légende en texte.
-- ─────────────────────────────────────────────────────────────────────────────

delete from point_images
where point_id = 'parc_a_charbon' and chemin = '662A19A8-CD33-4A41-84FE-B821D05B1A11_result_result.avif';

update point_images set ordre = 1
where point_id = 'parc_a_charbon' and chemin = 'parc a charbon_result.avif';

insert into point_images (point_id, chemin, ordre, legende) values
  ('parc_a_charbon', 'chaine d''accouplement_result_result.avif', 2,
   'Condamnés en corvée portant la chaîne d''accouplement, devant le parc à charbon du Camp est. Cliché pris lors de la campagne du Protet, 1899. Collection Jacky Tronel, blog Histoire pénitentiaire et Justice militaire.'),
  ('parc_a_charbon', 'condamne sur chantier parc a charbon_result_result.avif', 3,
   'Condamnés portant la double chaîne sur le chantier du parc à charbon ; le hangar à charbon est endommagé, toiture et gouttières en partie disparues. Album Rime, ANC.')
on conflict (point_id, chemin) do update set
  ordre = excluded.ordre, legende = excluded.legende;
