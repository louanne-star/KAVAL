-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : raccourcit Histoire + Architecture de la
-- Chapelle Saint-Thomas, retire les tirets cadratins et les notes en *
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ne touche ni au quiz ni au témoignage : les faits utilisés par les 4
-- premières questions (torchis et chaume en 1865, cyclone de 1880, charpente
-- de la guerre de Crimée, chœur tourné vers le soleil levant) sont tous
-- conservés dans les versions raccourcies.
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'La chapelle Saint-Thomas est l''un des premiers bâtiments construits par les forçats de l''Iphigénie, le navire qui a transporté les premiers condamnés vers l''île Nou. Le 1er février 1865, le gouverneur Guillain annonce une chapelle provisoire en torchis et chaume. Très endommagée par le cyclone de 1880, elle est remplacée en 1882 par la chapelle actuelle.',
  texte_en =
    'The Chapelle Saint-Thomas is one of the first buildings built by the convicts of the Iphigénie, the ship that transported the first convicts to Île Nou. On 1 February 1865, governor Guillain announces a temporary chapel of wattle and thatch. Badly damaged by the 1880 cyclone, it is replaced in 1882 by the present chapel.'
where id = '6639acd0-96bb-4639-acdf-21243e7229d5';

update point_sections set
  texte =
    'Le nouvel édifice est perpendiculaire à la mer, avec le chœur tourné vers le soleil levant, monté sur une charpente en fer datant de la guerre de Crimée. Le toit est en tuiles, les bas-côtés en briques apparentes avec de lourds volets en bois « à l''italienne », dans le style caractéristique de la Pénitentiaire. L''île Nou compte deux autres chapelles : Saint-Michel au Camp Est et Saint-Joachim à l''hôpital du Marais.',
  texte_en =
    'The new building stands perpendicular to the sea, its choir facing the rising sun, raised on an iron frame dating from the Crimean War. The roof is tiled, the side aisles are of exposed brick with heavy "Italian-style" wooden shutters, in the style typical of the Pénitentiaire administration. Île Nou has two other chapels: Saint-Michel at Camp Est and Saint-Joachim at the Hôpital du Marais.'
where id = '7559d07f-8da0-45ca-82a4-8484b4bee094';
