-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : raccourcit Histoire + Anecdote des Ateliers
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ne touche ni au quiz ni au témoignage : les faits utilisés par les 5
-- questions (bâtiment terminé vers 1878, "ouvriers d'art", 15 000 paires de
-- chaussures et 10 000 chapeaux de paille en 1876, fermeture 1890 pour
-- concurrence déloyale) sont tous conservés dans les versions raccourcies.
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'Le bâtiment en H des ateliers, terminé vers 1878, était le cœur économique du bagne. Les forçats qui y travaillaient, tailleurs, cordonniers, charrons, forgerons et matelassiers, étaient classés « ouvriers d''art » et bénéficiaient d''un traitement plus favorable que les autres condamnés. En 1876, les 73 cordonniers produisaient 15 000 paires de chaussures, et 90 condamnés impotents tressaient 10 000 chapeaux de paille.',
  texte_en =
    'The H-shaped workshop building, completed around 1878, was the economic heart of the penal colony. The convicts who worked there, tailors, shoemakers, cartwrights, blacksmiths and mattress-makers, were classed as "skilled craftsmen" and received more favourable treatment than other prisoners. In 1876, the 73 shoemakers produced 15,000 pairs of shoes, and 90 disabled convicts plaited 10,000 straw hats.'
where id = '98a50d78-e912-4f46-b6ca-925274280aa8';

update point_sections set
  texte =
    'Parmi les charrons, un condamné surnommé « la Chique », ancien charretier originaire de Laon, conduisait fièrement les voitures et tombereaux fabriqués sur place. En 1890, les ateliers ferment sur ordre ministériel : les entrepreneurs de la colonie dénonçaient une concurrence déloyale de la main-d''œuvre forcée.',
  texte_en =
    'Among the cartwrights, a convict nicknamed "la Chique", a former carter from Laon, proudly drove the carts and tip-carts built on site. In 1890, the workshops close by ministerial order: the colony''s contractors denounced unfair competition from forced labour.'
where id = 'ca867d57-0f11-4afe-bb3e-37cc21dd4579';
