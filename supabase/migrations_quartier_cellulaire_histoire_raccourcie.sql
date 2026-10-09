-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : raccourcit l'Histoire du Quartier cellulaire
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Ne touche ni au quiz ni au témoignage : les 4 faits utilisés par les
-- questions 1 à 4 (agrandissement 1876-1878, bâtiment n°2 = condamnés à
-- mort, couloir donnant sur la caserne des surveillants mariés, citation
-- de Carol) sont tous conservés dans la version raccourcie.
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'Le bâtiment cellulaire de l''île Nou est considérablement agrandi entre 1876 et 1878. À l''angle sud-est de la grande cour, le bâtiment n°2 est réservé aux condamnés à mort. À l''étage, un couloir donne sur la colline où se trouve la caserne des surveillants mariés. Les portes des cellules, munies de guichets, sont, selon le forçat Carol, « effroyablement verrouillées ».',
  texte_en =
    'The cell block on Île Nou is considerably enlarged between 1876 and 1878. At the south-east corner of the main yard, building n°2 is reserved for those condemned to death. Upstairs, a corridor looks out over the hill where the married guards'' barracks stands. The cell doors, fitted with hatches, are, according to convict Carol, "appallingly bolted."'
where id = 'ffa57ef8-7b9e-40b3-bfbb-3dc3992972c4';
