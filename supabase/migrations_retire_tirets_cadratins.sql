-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : retire les tirets cadratins ("—") du contenu
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Nettoyage demandé par l'équipe : plus aucun "—" dans les textes affichés
-- dans l'app (points.description/zones étaient déjà propres). Chaque
-- UPDATE cible une ligne précise par id (ou point_id pour temoignages, qui
-- en est la clé primaire) et reformule localement la phrase (virgule, deux
-- points, point-virgule ou parenthèses selon le cas) plutôt que de
-- simplement supprimer le caractère.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── point_sections ──────────────────────────────────────────────────────────

update point_sections set texte_en =
  'The bakery, or manutention, is one of the first permanent buildings of the penal colony, built in 1868 under governor Guillain. A plaque on its pediment still attests to it. Its brick-vaulted ovens, reinforced with cut-stone corner chains, produced bread for all the island''s convicts. Convicts assigned to the bakery worked different hours from the other prisoners and did not sleep in the same huts. In addition to the baking work, they had to cut a considerable amount of firewood to fuel the ovens.'
where id = 'd73a87f6-2484-430b-87f5-0fef24f3eee5';

update point_sections set texte_en =
  'After 1890, the only two major construction projects undertaken on Île Nou are the barracks for first-class guards and the insane ward at the Hôpital du Marais, a period when the penal colony gradually stops producing. Earlier, in 1875, the Privy Council notes that military guards are "temporarily housed in wooden huts with straw and rubble infill, uncomfortable and... insufficient quarters." Two barracks are then decided on: one for 20 single guards (37,000 francs) and one for 15 married guards (54,200 francs), a total of 91,200 francs. In Jean Allemane''s account of Duménil''s execution (1877), it is in fact a "first-class guard" who draws his sword and gives the firing squad the order to shoot.'
where id = '32870097-afb9-403b-b236-a6a98eb7f258';

update point_sections set
  texte =
    'Au cœur du Camp Central, le Boulevard du Crime, surnom ironique donné par les forçats eux-mêmes, désigne l''allée menant à la cour des exécutions. C''est ici que la guillotine était dressée. Seuls les condamnés de la 4e classe assistaient aux exécutions : c''est eux qui montaient l''échafaud, enlevaient le corps, puis démontaient l''instrument de mort.',
  texte_en =
    'At the heart of the Camp Central, the Boulevard du Crime, an ironic nickname given by the convicts themselves, is the name for the path leading to the execution yard. This is where the guillotine was set up. Only fourth-class convicts attended executions: it was they who mounted the scaffold, removed the body, and then dismantled the instrument of death.'
where id = '27d68ade-9848-4528-b299-389185866487';

update point_sections set texte_en =
  'At Camp Est, water is a constant problem. It is brackish and undrinkable, forcing convicts to fetch good water from the Fontaine Bigard. A work detail brought some back each day, but it was reserved for staff. Camp Est caused a great deal of dysentery at the hospital. After repeated reports from doctors, a cistern is built inside the camp. It still exists today, and can hold up to 1,200 m³ of drinking water. The camp is enclosed by a first perimeter wall measuring 160 m by 100 m, then a second one of 70 m by 56 m around the five huts of the 2nd group. A well with a winch and coping stone can still be seen in the north-east corner.'
where id = 'adeab175-e655-46a6-a78a-cee99411e0a1';

update point_sections set
  texte =
    'Le magasin s''inscrit dans un bagne qui produit une bonne partie de ce qu''il consomme : les ateliers habillent les condamnés, la boulangerie (1868) fait le pain, la Ferme-Nord fournit le lait et la luzerne. Ateliers et fermes ferment en 1890 après les plaintes des entrepreneurs de la colonie : le bagne cesse de produire, mais « continue d''être le plus gros consommateur de la colonie ».',
  texte_en =
    'The store is part of a penal colony that produces much of what it consumes: the workshops clothe the convicts, the bakery (1868) bakes the bread, and the Ferme-Nord supplies milk and alfalfa. The workshops and farms close in 1890 after complaints from the colony''s private contractors: the penal colony stops producing, but, as the book puts it, "remains the biggest consumer in the colony."'
where id = 'c209c8aa-e92c-48df-8dcc-0e41f7eb87d0';

update point_sections set
  texte =
    'Le nouvel édifice est perpendiculaire à la mer, avec le chœur tourné vers le soleil levant. La nef et le chœur mesurent près de 30 m sur 6,5 m, montés sur une charpente en fer datant de la guerre de Crimée. Le toit est en tuiles, les bas-côtés en briques apparentes avec de lourds volets en bois « à l''italienne », et le fronton s''élève à près de 9 m, le style caractéristique de la Pénitentiaire, qu''on retrouve aussi à Fonwhari et Néméara. L''île Nou compte deux autres chapelles : Saint-Michel au Camp Est et Saint-Joachim à l''hôpital du Marais.',
  texte_en =
    'The new building stands perpendicular to the sea, its choir facing the rising sun. The nave and choir measure nearly 30 m by 6.5 m, raised on an iron frame dating from the Crimean War. The roof is tiled, the side aisles are of exposed brick with heavy "Italian-style" wooden shutters, and the pediment rises almost 9 m, the style typical of the Pénitentiaire administration, also found at Fonwhari and Néméara. Île Nou has two other chapels: Saint-Michel at Camp Est and Saint-Joachim at the Hôpital du Marais.'
where id = '7559d07f-8da0-45ca-82a4-8484b4bee094';

update point_sections set
  texte =
    'Le bâtiment en H des ateliers, terminé vers 1878, était le cœur économique du bagne. Trois corps de bâtiment imposants abritaient tailleurs, cordonniers, charrons, forgerons et matelassiers, des forçats classés "ouvriers d''art" et bénéficiant d''un traitement plus favorable que les autres condamnés. Les chiffres donnent le vertige : en 1876 seulement, 90 tailleurs confectionnaient 12 500 chemises et 13 600 pantalons, 73 cordonniers produisaient 15 000 paires de chaussures, et 90 condamnés impotents tressaient 10 000 chapeaux de paille. En 1877, 18 matelassiers fabriquaient près de 3 000 hamacs.',
  texte_en =
    'The H-shaped workshop building, completed around 1878, was the economic heart of the penal colony. Three imposing wings housed tailors, shoemakers, cartwrights, blacksmiths and mattress-makers, convicts classed as "skilled craftsmen" who received more favourable treatment than other prisoners. The figures are staggering: in 1876 alone, 90 tailors made 12,500 shirts and 13,600 trousers, 73 shoemakers produced 15,000 pairs of shoes, and 90 disabled convicts plaited 10,000 straw hats. In 1877, 18 mattress-makers made nearly 3,000 hammocks.'
where id = '98a50d78-e912-4f46-b6ca-925274280aa8';

update point_sections set
  texte =
    'La caserne des surveillants mariés, construite entre 1877 et 1878, offrait 18 logements de deux à trois pièces avec véranda et toit en tuiles. Avant sa construction, le Conseil privé constatait que les surveillants étaient « logés dans des cases en bois et en paille, peu confortables ». Des familles entières vivaient ici (des femmes, des enfants) à quelques mètres seulement des cellules des condamnés. Aujourd''hui, ce bâtiment historique abrite l''IUT de l''Université de la Nouvelle-Calédonie.',
  texte_en =
    'The married guards'' barracks, built between 1877 and 1878, offered 18 two- to three-room lodgings with a veranda and tiled roof. Before it was built, the Privy Council noted that guards were "housed in wooden and straw huts, uncomfortable". Whole families lived here (wives, children) just a few metres from the convicts'' cells. Today, this historic building houses the University of New Caledonia''s IUT.'
where id = 'b9d417e6-5d08-4341-a8c8-e6417aac4b78';

update point_sections set
  texte =
    'Le bâtiment cellulaire des condamnés à mort donnait directement sur la colline de la caserne. Les portes des cellules étaient, selon le forçat Carol, « effroyablement verrouillées », pendant que la vie ordinaire continuait juste en face.',
  texte_en =
    'The death-row cell block looked directly out onto the barracks'' hill. The cell doors were, according to the convict Carol, "dreadfully bolted", while ordinary life carried on just across the way.'
where id = 'f6b07766-8819-4c76-a7e1-04c5fcbaa94a';

update point_sections set texte_en =
  'The supply and provisions store is where the Penitentiary Administration stocks and distributes what keeps the penal colony and its staff fed and equipped. The rear of the building serves as offices for the Penitentiary Administration and housing for staff, including the clerk in charge of clothing. Guards'' families live here too, among them those of guard Albert Pérault and gendarme Montané.'
where id = '537c71c9-0f35-4022-8f1f-d74956c6b732';

update point_sections set
  texte =
    'Parmi les charrons travaillant aux ateliers, un condamné surnommé "la Chique", ancien charretier originaire de Laon, conduisait fièrement les voitures et tombereaux fabriqués sur place. En 1890, les ateliers furent contraints de fermer sur ordre ministériel : les entrepreneurs et agriculteurs de la colonie se plaignaient d''une concurrence déloyale de la main-d''œuvre forcée.',
  texte_en =
    'Among the cartwrights working at the workshops, a convict nicknamed "la Chique", a former carter from Laon, proudly drove the carts and tip-carts built on site. In 1890, the workshops were forced to close by ministerial order: the colony''s contractors and farmers had complained of unfair competition from forced labour.'
where id = 'ca867d57-0f11-4afe-bb3e-37cc21dd4579';

-- ── temoignages ──────────────────────────────────────────────────────────────

update temoignages set
  texte =
    '« L''exécution capitale se fait par la guillotine. Elle a lieu sur le terrain appelé vulgairement le boulevard du Crime ! Alors retentit le cri : Quatrième classe, genoux-terre ; ordre immédiatement exécuté par cinq à six cents hommes. Une minute après, la justice est satisfaite. »',
  texte_en =
    '"Capital execution is carried out by guillotine. It takes place on the ground commonly called the Boulevard du Crime! Then comes the cry: Fourth class, kneel down; an order obeyed at once by five to six hundred men. A minute later, justice is served."'
where point_id = 'boulevard_du_crime';

update temoignages set texte_en =
  '"Right at the edge of the bay, at one end, stands a thatched hut with, at the front, a tiny bell tower topped by a cross, this is the church of Île Nou, where, every Sunday, the convicts go under escort to attend mass."'
where point_id = 'chapelle_saint_thomas';

-- ── point_images (légendes) ────────────────────────────────────────────────

update point_images set
  legende =
    'Le bourreau Rieusset devant sa cabane, à la Vacherie. Les derniers bourreaux en fonction logeront sur la colline au-dessus. Collection musée Ernest Cognacq, fonds Ubaud, Saint-Martin-de-Ré.',
  legende_en =
    'Executioner Rieusset in front of his cabin at La Vacherie. The last serving executioners would later live on the hill above. Musée Ernest Cognacq collection, Ubaud fund, Saint-Martin-de-Ré.'
where id = 'a281a5a8-9559-4111-ae5a-fd3cc31b4635';

update point_images set
  legende =
    'Couloir à l''étage de la caserne des surveillants mariés. Les portes, munies de guichets, sont, selon les mots de Carol, « effroyablement verrouillées ». Cliché Dufty, album Nicolas Hagen, ANC.',
  legende_en =
    'Upstairs corridor of the married guards'' barracks. The doors, fitted with hatches, are, in Carol''s words, "dreadfully locked". Photograph by Dufty, Nicolas Hagen album, ANC.'
where id = 'e98da317-4f5e-4b7e-b86e-a423353da8d4';

-- ── personnage_paragraphes (Raoul Tellier) ─────────────────────────────────

update personnage_paragraphes set texte_en =
  'Between 1883 and 1931, he escaped the Caledonian penal colony <strong>sixteen times</strong>. His combined attempts earned him <strong>86 additional years</strong> of forced labour. Mathematically, his sentences would not expire until <strong>the year 2000</strong>. The justice system wanted to bury him under his convictions, but Tellier kept going anyway.'
where id = '0e2a300b-e09e-47df-8b86-cd1802f7a76d';

update personnage_paragraphes set texte_en =
  'Raoul Tellier never truly escaped: New Caledonia is an island. But more than anyone, he refused to <strong>let the penal colony own him</strong>.'
where id = 'a6bd52e8-3218-4eba-bc0a-19f643cc0946';
