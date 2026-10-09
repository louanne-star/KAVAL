-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : lot 2 de nettoyage/raccourcissement de textes
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Aucune de ces modifications ne touche aux quiz : chaque fait utilisé par
-- une question (voir commentaires) est conservé dans la version raccourcie.
-- Note : logement_surveillant_principal (section Histoire) est déjà couvert
-- par migrations_logement_surveillant_principal_v2.sql, pas encore exécutée
-- — rien à refaire ici.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Logement des surveillants mariés : juste retirer les tirets ────────────

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

-- ── Boulangerie : Histoire + Anecdote raccourcies, tiret retiré ────────────
-- Faits conservés pour le quiz : 1868, gouverneur Guillain, horaires
-- différents, bois de chauffe (Histoire) ; cheminées rallongées vers 1893
-- pour ne pas incommoder les logements alentour (Anecdote).

update point_sections set
  texte =
    'La boulangerie est l''un des premiers bâtiments en dur du bagne, construit en 1868 sous le gouverneur Guillain. Elle produisait le pain de tous les forçats de l''île. Les condamnés qui y étaient affectés avaient des horaires différents des autres et devaient, en plus, débiter une quantité considérable de bois de chauffe pour alimenter les fours.',
  texte_en =
    'The bakery is one of the first permanent buildings of the penal colony, built in 1868 under governor Guillain. It produced bread for all the island''s convicts. Convicts assigned there worked different hours from the others and, in addition, had to cut a considerable amount of firewood to fuel the ovens.'
where id = 'd73a87f6-2484-430b-87f5-0fef24f3eee5';

update point_sections set
  texte =
    'En 1872, le photographe Ernest Robin se fait photographier devant l''entrée de la boulangerie, posant devant un réverbère à système de poulie pour allumer et descendre le fanal. Les cheminées, pas encore rallongées à l''époque, ne furent exhaussées que vers 1893, pour éviter d''incommoder les logements alentour.',
  texte_en =
    'In 1872, photographer Ernest Robin has his picture taken in front of the bakery''s entrance, posing by a street lamp with a pulley system for lighting and lowering the lantern. The chimneys, not yet heightened at the time, were only raised around 1893, to stop the smoke from bothering the nearby lodgings.'
where id = 'cbe31e54-091c-42c5-8c5c-cfcf06d2032e';

-- ── Château d'eau et tour de guet : Histoire + Témoignage raccourcis ───────
-- Faits conservés pour le quiz : Fontaine Bigard, dysenteries, citerne
-- 1 200 m³, corvée réservée au personnel, puits avec treuil et margelle au
-- nord-est (tous dans Histoire, le témoignage n'est pas quizzé).

update point_sections set
  texte =
    'Au Camp Est, l''eau est saumâtre et imbuvable : il faut aller chercher la bonne eau à la Fontaine Bigard, une corvée quotidienne réservée au personnel. Le camp provoque beaucoup de dysenteries à l''hôpital. À force de rapports médicaux, une citerne pouvant contenir jusqu''à 1 200 m³ est construite à l''intérieur du camp ; elle existe encore aujourd''hui, de même qu''un puits avec treuil et margelle, visible dans le coin nord-est.',
  texte_en =
    'At Camp Est, the water is brackish and undrinkable: good water had to be fetched from the Fontaine Bigard, a daily work detail reserved for staff. The camp caused a great deal of dysentery at the hospital. After repeated medical reports, a cistern able to hold up to 1,200 m³ is built inside the camp; it still stands today, as does a well with a winch and coping stone, visible in the north-east corner.'
where id = 'adeab175-e655-46a6-a78a-cee99411e0a1';

update temoignages set
  texte =
    '« À ce moment, au Camp Est, l''eau était saumâtre, imbuvable. Il fallait aller à la Fontaine Bigard pour en avoir de la bonne. [...] On se décida quand même à construire une citerne à l''intérieur du Camp. Elle existe toujours. »',
  texte_en =
    '"At that time, at Camp Est, the water was brackish, undrinkable. One had to go to the Fontaine Bigard for good water. [...] it was eventually decided to build a cistern inside the Camp. It still stands today."'
where point_id = 'chateau_eau_tour_guet';

-- ── Hôtel du Commandant : Histoire raccourcie (Anecdote inchangée) ─────────
-- Faits conservés pour le quiz : 1872/établissement Paddon, 1882/titre
-- "commandant supérieur", escalier double en pierres de taille, aloe vera.

update point_sections set
  texte =
    'En 1872, le logement du commandant est une modeste demeure, ancienne maison de maître de l''établissement Paddon. À partir de 1882, il est ouvert aux civils avec le titre de « commandant supérieur ». L''hôtel actuel, achevé vers 1885, affiche un plan symétrique à quatre pavillons reliés par une galerie centrale, avec un escalier double en pierres de taille et un vaste jardin anglais (aloe vera, pandanus, orangers).',
  texte_en =
    'In 1872, the commandant''s residence is a modest dwelling, the former manor house of the Paddon estate. From 1882, it is opened to civilians, with the title of "commandant supérieur." The present building, completed around 1885, has a symmetrical plan with four pavilions linked by a central gallery, a double staircase in dressed stone, and an extensive English-style garden (aloe vera, pandanus, orange trees).'
where id = '87a26635-a430-436f-a89a-6ce683320ade';
