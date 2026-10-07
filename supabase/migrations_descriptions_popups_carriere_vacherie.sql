-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : descriptions de 4 points popup
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace points.description (+ description_en) pour 4 points popup qui
-- n'avaient qu'un texte générique très court ("Il ne reste plus rien à voir
-- aujourd'hui.") : Carrière, La Vacherie, Case des libérés, Cimetière des
-- surveillants militaires. C'est le seul texte affiché pour un point popup
-- (pas de page détail, donc pas de point_sections/temoignages/quiz pour ce
-- type de point — contrairement aux points "vrai").
-- ─────────────────────────────────────────────────────────────────────────────

update points set
  description = 'La Grande Carrière du Camp Est était l''un des chantiers les plus épuisants du bagne : les forçats y extrayaient à la main les pierres bleues et grises qui ont servi à bâtir la quasi-totalité des bâtiments de l''île Nou, y compris les murs de leurs propres cellules.',
  description_en = 'The Grande Carrière at East Camp was one of the most gruelling work sites in the penal colony: convicts quarried by hand the blue and grey stone used to build almost every building on Île Nou, including the walls of their own cells.'
where id = 'carriere';

update points set
  description = 'Plaine s''étendant entre le Camp Est et le Camp Central, la Vacherie était à la fois le lieu d''élevage qui fournissait le lait de l''hôpital du Marais et le lieu de résidence des bourreaux du bagne, dont Charles Macé, exécuteur de 46 condamnés. Aujourd''hui, cette zone est intégrée au foyer Reznik, dans le CFA.',
  description_en = 'A plain stretching between East Camp and Central Camp, La Vacherie was both the dairy farm supplying milk to the Marais Hospital and home to the penal colony''s executioners, including Charles Macé, who carried out 46 executions. Today, the area is part of the Reznik residence within the CFA.'
where id = 'la_vacherie_ferme';

update points set
  description = 'Une fois leur peine purgée, les libérés (forçats officiellement affranchis) ne pouvaient pas quitter l''île immédiatement. Astreints à résider en Nouvelle-Calédonie, ils logeaient dans des cases modestes à proximité de la Vacherie, dans l''attente d''une concession de terre ou d''un travail.',
  description_en = 'Once they had served their sentence, freedmen (officially emancipated convicts) could not leave the island immediately. Required to reside in New Caledonia, they lived in modest huts near La Vacherie while awaiting a land grant or employment.'
where id = 'case_des_liberes';

update points set
  description = 'Distinct du cimetière des forçats, le cimetière des surveillants militaires accueillait ceux qui gardaient le bagne : morts de maladie, d''accident ou de vieillesse sur l''île. Aujourd''hui enfoui sous les terrains du lycée Jules Garnier, vers le dôme.',
  description_en = 'Distinct from the convicts'' cemetery, the military guards'' cemetery received those who guarded the penal colony: men who died of illness, accident or old age on the island. Today it lies buried beneath the grounds of Lycée Jules Garnier, near the dome.'
where id = 'cimetiere_surveillants_militaires';
