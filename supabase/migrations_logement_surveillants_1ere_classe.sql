-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : Logement des surveillants de 1ère classe
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Raccourcit la section Histoire (qui mélangeait construction + anecdote
-- Duménil) et sépare le contenu en 3 blocs : Histoire, Anecdote (nouvelle),
-- Témoignage (nouveau, point n'en avait pas encore).
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'En 1875, le Conseil privé constate que les surveillants sont « logés dans des cases en bois, en paille et en remplissage, peu confortables et insuffisants ». Deux casernes sont décidées : une pour 20 célibataires, une pour 15 mariés, soit 91 200 francs. Après 1890, c''est l''une des dernières grandes constructions de l''île Nou, le bagne cesse peu à peu de produire.',
  texte_en =
    'In 1875, the Privy Council notes that guards are "housed in wooden huts with straw and rubble infill, uncomfortable and insufficient quarters." Two barracks are decided on: one for 20 single guards, one for 15 married guards, a total of 91,200 francs. After 1890, this is one of the last major construction projects on Île Nou, as the penal colony gradually stops producing.'
where id = '32870097-afb9-403b-b236-a6a98eb7f258';

insert into point_sections (point_id, titre, titre_en, texte, texte_en, ordre) values
  ('logement_surveillants_1ere_classe', 'Anecdote', 'Anecdote',
   'Dans son récit de l''exécution de Duménil (1877), Jean Allemane décrit un « surveillant de 1re classe » tirant son épée pour commander le feu au peloton. Ces hommes n''étaient pas que des geôliers.',
   'In his account of Duménil''s execution (1877), Jean Allemane describes a "first-class guard" drawing his sword to give the firing squad the order to shoot. These men were not merely jailers.',
   2)
on conflict do nothing;

insert into temoignages (point_id, titre, titre_en, auteur, auteur_en, texte, texte_en) values
  ('logement_surveillants_1ere_classe',
   'Des logements « peu confortables et insuffisants »',
   '"Uncomfortable and insufficient" quarters',
   'Conseil privé, 1875',
   'Privy Council, 1875',
   '« Logés provisoirement dans des cases en bois, en paille et en remplissage, locaux peu confortables et… insuffisants. »',
   '"Temporarily housed in wooden huts with straw and rubble infill, uncomfortable and... insufficient quarters."')
on conflict (point_id) do update set
  titre = excluded.titre, titre_en = excluded.titre_en,
  auteur = excluded.auteur, auteur_en = excluded.auteur_en,
  texte = excluded.texte, texte_en = excluded.texte_en;
