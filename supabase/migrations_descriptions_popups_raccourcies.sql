-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : raccourcit les 4 descriptions popup
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (suite de migrations_descriptions_popups_carriere_vacherie.sql, déjà
-- exécutée — celle-ci remplace ses textes par une version plus courte)
--
-- Carrière, La Vacherie, Case des libérés, Cimetière des surveillants
-- militaires : le texte détaillé ajouté précédemment était trop long pour
-- le popup de la carte, raccourci en gardant le fait principal.
-- ─────────────────────────────────────────────────────────────────────────────

update points set
  description = 'L''un des chantiers les plus épuisants du bagne : les forçats y extrayaient à la main les pierres qui ont bâti la quasi-totalité de l''île Nou, y compris leurs propres cellules.',
  description_en = 'One of the penal colony''s most gruelling work sites: convicts quarried by hand the stone used to build almost all of Île Nou, including their own cells.'
where id = 'carriere';

update points set
  description = 'Plaine entre Camp Est et Camp Central : ferme laitière de l''hôpital du Marais et résidence des bourreaux, dont Charles Macé. Aujourd''hui intégrée au foyer Reznik (CFA).',
  description_en = 'A plain between East Camp and Central Camp: dairy farm for the Marais Hospital and home to the penal colony''s executioners, including Charles Macé. Today part of the Reznik residence (CFA).'
where id = 'la_vacherie_ferme';

update points set
  description = 'Une fois leur peine purgée, les libérés devaient rester en Nouvelle-Calédonie. Ils logeaient ici, près de la Vacherie, en attendant une terre ou un travail.',
  description_en = 'Once their sentence was served, freedmen had to remain in New Caledonia. They lived here, near La Vacherie, awaiting land or work.'
where id = 'case_des_liberes';

update points set
  description = 'Distinct du cimetière des forçats, il accueillait les surveillants militaires morts sur l''île. Aujourd''hui enfoui sous le lycée Jules Garnier, vers le dôme.',
  description_en = 'Distinct from the convicts'' cemetery, it received military guards who died on the island. Today buried beneath Lycée Jules Garnier, near the dome.'
where id = 'cimetiere_surveillants_militaires';
