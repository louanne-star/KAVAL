-- ═══════════════════════════════════════════════════════════════════════════
-- Traduction anglaise du contenu éditorial (zones, points, sections,
-- témoignages, quiz). Ajoute une colonne "_en" par champ traduisible et
-- remplit les traductions du contenu existant au moment de l'écriture de
-- cette migration (03/09/2026).
--
-- L'app (points.service.ts) lit ces colonnes si elles existent et retombe
-- silencieusement sur le français si une colonne ou une traduction manque —
-- cette migration peut donc être exécutée sans rien casser, et du contenu
-- ajouté après coup sans sa traduction anglaise s'affichera en français
-- pour les utilisateurs en mode EN jusqu'à ce qu'elle soit renseignée.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── zones ─────────────────────────────────────────────────────────────────
alter table zones add column if not exists nom_en text;
alter table zones add column if not exists sous_titre_en text;

update zones set nom_en = 'The East Camp',              sous_titre_en = 'Quarry & industry'      where id = 'camp_est';
update zones set nom_en = 'The Vacherie',                sous_titre_en = 'Agriculture & freedmen'  where id = 'vacherie';
update zones set nom_en = 'The Marais Hospital',         sous_titre_en = 'Care & chapel'           where id = 'hopital';
update zones set nom_en = 'The North Farm',              sous_titre_en = 'Lighthouse & leper colony' where id = 'ferme_nord';
update zones set nom_en = 'The Penitentiary Zone',       sous_titre_en = 'Heart of the penal colony' where id = 'penitencier';

-- ── points ────────────────────────────────────────────────────────────────
alter table points add column if not exists nom_en text;
alter table points add column if not exists description_en text;

update points set nom_en = 'Lime kiln', description_en = 'Remains of a wall bearing witness to the site''s past industrial activity.'
  where id = 'four_a_chaux';
update points set nom_en = 'Quarry', description_en = 'Extraction site located on the mountain. Nothing remains to be seen there today.'
  where id = 'carriere';
update points set nom_en = 'Military guards'' cemetery', description_en = 'Located at Lycée Jules Garnier, near the dome. Nothing remains to be seen there today.'
  where id = 'cimetiere_surveillants_militaires';
update points set nom_en = 'Freedmen''s cottage', description_en = 'Historic building located at the current CFA site. Nothing remains to be seen there today.'
  where id = 'case_des_liberes';
update points set nom_en = 'Provisions store (Island Theatre)', description_en = 'Former food storage site, now converted into a theatre.'
  where id = 'magasin_a_vivre';
update points set nom_en = 'Brickworks', description_en = 'Brick-making site using clay extracted from the surrounding marshes.'
  where id = 'briqueterie';
update points set nom_en = 'Freedmen''s village', description_en = 'Settlement for former convicts who had completed their sentence.'
  where id = 'village_des_liberes';
update points set nom_en = 'Leper colony', description_en = 'Site where all convicts afflicted with leprosy were gathered.'
  where id = 'leproserie';
update points set nom_en = 'East Camp', description_en = 'Historic penitentiary centre and central point of this zone.'
  where id = 'camp_est_principal';
update points set nom_en = 'Marais Hospital', description_en = 'Hospital complex including the mental ward and a cemetery located on the nearby beach.'
  where id = 'hopital_du_marais';
update points set nom_en = 'North Farm', description_en = 'Agricultural and livestock production centre, comprising around twenty buildings where convicts worked the land and raised livestock to supply the Marais Hospital.'
  where id = 'ferme_nord_luzerne';
update points set nom_en = 'Hospital garden and guard''s lodging', description_en = 'Vegetable garden for the sick and lodging located at the bottom of the campus.'
  where id = 'jardin_hopital_logement_surveillant';
update points set nom_en = 'La Vacherie (Farm)', description_en = 'Former penal farm, now part of the Reznik residence within the CFA.'
  where id = 'la_vacherie_ferme';
update points set nom_en = 'Coal yard', description_en = 'The coal yard was a labour site where convicts handled fuel for the penitentiary.'
  where id = 'parc_a_charbon';
update points set nom_en = 'Infantry barracks (Military quarter)', description_en = 'Quartering buildings for the military surveillance forces.'
  where id = 'caserne_infanterie';
update points set nom_en = 'Primary school for guards'' children', description_en = 'School for the families of surveillance staff. Nothing remains to be seen there today.'
  where id = 'ecole_primaire_surveillants';
update points set nom_en = 'Administrative officers'' building', description_en = 'Administrative headquarters of the penitentiary management.'
  where id = 'batiment_officiers_administration';
update points set nom_en = 'First-class guards'' lodging', description_en = 'Housing reserved for senior-ranking guards.'
  where id = 'logement_surveillants_1ere_classe';
update points set nom_en = 'Married military guards'' lodging', description_en = 'Housing quarters for the families of military guards.'
  where id = 'logement_surveillants_militaires_maries';
update points set nom_en = 'Cell block (240 cells and 14 dungeons)', description_en = 'The high-security area for solitary confinement and punishment.'
  where id = 'quartier_cellulaire';
update points set nom_en = 'Boulevard du Crime', description_en = 'Area comprising the convicts'' dormitory huts.'
  where id = 'boulevard_du_crime';
update points set nom_en = 'Chief guard''s lodging', description_en = 'Official residence of the head of surveillance.'
  where id = 'logement_surveillant_principal';
update points set nom_en = 'Saint-Thomas Chapel and Presbytery', description_en = 'Religious centre of the penal colony.'
  where id = 'chapelle_saint_thomas';
update points set nom_en = 'Water tower and watchtower', description_en = 'Infrastructure for water supply and panoramic surveillance.'
  where id = 'chateau_eau_tour_guet';
update points set nom_en = 'Commandant''s residence', description_en = 'Official residence of the penal colony''s director.'
  where id = 'hotel_du_commandant';

-- ── point_sections ────────────────────────────────────────────────────────
alter table point_sections add column if not exists titre_en text;
alter table point_sections add column if not exists texte_en text;

update point_sections set titre_en = 'History', texte_en =
  'Built from 1874 at the southern tip of Île Nou, Camp Est brought together dormitory huts, a prison, a laundry and the head guard''s lodging. Its brackish water, a source of frequent dysentery, long forced convicts to fetch water from the Fontaine Bigard before a water tank was built. The camp also housed the feared disciplinary quarter, where fixed-term convicts and lifers known as "berlingots" endured a gruelling regime (reduced rations, wooden blocks, long hours standing). It was from there that convict Raoul Tellier attempted his twelfth escape in 1897, which quickly failed despite meticulous preparation.'
  where id = '4495259a-7694-44b0-a7ec-4d1a30df4415';

update point_sections set titre_en = 'History', texte_en =
  'It was considered one of the finest establishments of the Penitentiary Administration and served as a "true school of surgery for young colonial doctors."'
  where id = 'c98e1716-ef2c-4693-91af-46eb5e50662a';

update point_sections set titre_en = 'The medical war', texte_en =
  'A constant tension existed between the administration and the convicts, who feigned illness (fevers, ulcers, delirium) using local plants such as thorn apple (Datura) or St. John''s wort to escape forced labour.'
  where id = '5ffa5995-239f-41c6-9045-529e3134877c';

update point_sections set titre_en = 'History', texte_en =
  'In 1878, an imported brick cost 250 francs per 1,000, compared to just 20 francs for one made locally on Île Nou. Faced with this saving, the administration had a brick kiln built despite the opposition of Mr Joubert, a civilian member of the Council. In 1885, the brickworks produced 220,000 bricks; bricks marked "AP", "Ile Nou" or "Koé" (made at Koé, Dumbéa) can still be found today.'
  where id = '828f3495-a0a3-4972-a890-8d9de406d710';

-- ── temoignages ───────────────────────────────────────────────────────────
alter table temoignages add column if not exists titre_en text;
alter table temoignages add column if not exists auteur_en text;
alter table temoignages add column if not exists texte_en text;

update temoignages set
  titre_en = 'The Hell of Camp Est',
  auteur_en = 'Lucien Jossevel, Swiss convict',
  texte_en = 'Stripped of all dignity, dressed in simple sackcloth and shackled with heavy leg irons, the convicts endured merciless punishment. From sunrise to sunset, starved on survival rations cut in half, they were forced to walk in circles in a hall at a frantic pace, like carousel horses. But the horror peaked during the short minutes of respite. This supposed rest was in fact real psychological and physical torture: forced to sit in deathly silence on excruciatingly narrow vertical wooden blocks, the pain was such that the convict admitted "one would be better off impaled". A descent into hell where the pause became a torment worse than the labour itself.'
  where point_id = 'camp_est_principal';

update temoignages set
  titre_en = 'A well-established site',
  auteur_en = 'Inspector Cabanel, 11 October 1882',
  texte_en = 'The brickworks are very well established, opposite the transportation garden. The drying sheds are very good. I was assured that it supplied 60 to 75,000 bricks per month. It is understood that I give this figure with all reservations. There is suitable lodging for guard Chevallier, who is in charge of this important site.'
  where point_id = 'briqueterie';

-- ── quiz_questions ────────────────────────────────────────────────────────
alter table quiz_questions add column if not exists question_en text;
alter table quiz_questions add column if not exists bonne_reponse_en text;
alter table quiz_questions add column if not exists mauvaise_reponse_1_en text;
alter table quiz_questions add column if not exists mauvaise_reponse_2_en text;

update quiz_questions set
  question_en = 'Where do the Camp Est convicts have to fetch drinking water, since they cannot drink the camp''s own water?',
  bonne_reponse_en = 'At the Fontaine Bigard.',
  mauvaise_reponse_1_en = 'At the Commandant''s well.',
  mauvaise_reponse_2_en = 'At the Baie des Dames river.'
  where id = 'c4d5d20c-a4ad-43b4-9159-c4624b1f26bf';

update quiz_questions set
  question_en = 'In penal colony slang, what nickname is given to the lifers placed in Camp Est''s disciplinary quarter?',
  bonne_reponse_en = 'The "berlingots".',
  mauvaise_reponse_1_en = 'The "incorrigibles".',
  mauvaise_reponse_2_en = 'The "lifers".'
  where id = 'dc7f9a55-c4fa-4971-b965-301ee788aba9';

update quiz_questions set
  question_en = 'What small railway connects the coal shed to the loading pier?',
  bonne_reponse_en = 'A Decauville railway.',
  mauvaise_reponse_1_en = 'A standard-gauge railway.',
  mauvaise_reponse_2_en = 'A steam tramway.'
  where id = 'f5a6706c-3401-4083-afe1-b45dae2664e1';

update quiz_questions set
  question_en = 'In what year does Raoul Tellier attempt his 12th escape from Camp Est?',
  bonne_reponse_en = 'In 1897 (7 October).',
  mauvaise_reponse_1_en = 'In 1889.',
  mauvaise_reponse_2_en = 'In 1901.'
  where id = '921bb321-e226-4100-b02a-b7c0585e2a72';

update quiz_questions set
  question_en = 'What punishment does Tellier receive for this failed escape attempt?',
  bonne_reponse_en = 'Four additional years of forced labour, pronounced by the special maritime tribunal.',
  mauvaise_reponse_1_en = 'The death penalty, commuted to life imprisonment.',
  mauvaise_reponse_2_en = 'Six months in the dungeon on dry bread.'
  where id = '9afcbecd-6cd6-4167-b75c-333d2653e9e9';

update quiz_questions set
  question_en = 'What was the hospital''s capacity in 1878?',
  bonne_reponse_en = '400 beds',
  mauvaise_reponse_1_en = '100 beds',
  mauvaise_reponse_2_en = '1,000 beds'
  where id = 'ff29d287-f420-470a-a182-37f2af3ac33f';

update quiz_questions set
  question_en = 'How were flies naturally kept away in the treatment wards?',
  bonne_reponse_en = 'By hanging niaouli branches',
  mauvaise_reponse_1_en = 'By using honey traps',
  mauvaise_reponse_2_en = 'By spraying salt water'
  where id = '298cac8d-5c71-4d2f-abf7-f27bf2616107';

update quiz_questions set
  question_en = 'What grim term did director Jules Telle use in 1885 to describe the mental ward?',
  bonne_reponse_en = 'A "tomb with cell compartments"',
  mauvaise_reponse_1_en = 'A haven of peace',
  mauvaise_reponse_2_en = 'A school of medicine'
  where id = 'f2c2d58e-5a54-4cfb-804b-0a3499c8275c';

update quiz_questions set
  question_en = 'What landscape feature provided access to the hospital from the central penitentiary?',
  bonne_reponse_en = 'A road lined with a row of coconut trees',
  mauvaise_reponse_1_en = 'A tunnel dug into the rock',
  mauvaise_reponse_2_en = 'A pine-covered passage'
  where id = '004cce51-d539-4322-ac67-54e812d5462a';

update quiz_questions set
  question_en = 'What became of the land after the hospital cemetery was cleared in 1989?',
  bonne_reponse_en = 'A car park',
  mauvaise_reponse_1_en = 'A public garden',
  mauvaise_reponse_2_en = 'A penal colony museum'
  where id = '67045733-067f-4acb-828c-90f1a9d1f480';

update quiz_questions set
  question_en = 'In 1878, how much did bricks made locally on Île Nou cost per 1,000 units?',
  bonne_reponse_en = '20 francs.',
  mauvaise_reponse_1_en = '50 francs.',
  mauvaise_reponse_2_en = '250 francs.'
  where id = '3cd2d56f-fbf8-4dc6-935e-b51024b9d3c8';

update quiz_questions set
  question_en = 'How many bricks did the brickworks produce in 1885?',
  bonne_reponse_en = '220,000 bricks.',
  mauvaise_reponse_1_en = '260,000 bricks.',
  mauvaise_reponse_2_en = '75,000 bricks.'
  where id = '0a751ae6-5c22-4e50-b825-5ae4a5361d2a';

update quiz_questions set
  question_en = 'Who was the only member of the Privy Council to oppose the construction of the brick kiln?',
  bonne_reponse_en = 'Mr Joubert.',
  mauvaise_reponse_1_en = 'Inspector Cabanel.',
  mauvaise_reponse_2_en = 'Guard Chevallier.'
  where id = 'd497e5cb-b39d-4f3b-94f9-cff5f0c23ddc';

update quiz_questions set
  question_en = 'What markings can still be found today on some Île Nou bricks?',
  bonne_reponse_en = '"AP", "Ile Nou" or "Koé".',
  mauvaise_reponse_1_en = '"BAT" or "Camp Est".',
  mauvaise_reponse_2_en = '"Nouméa" or "Bagne 1878".'
  where id = '19ae358b-4a13-43a1-bfe7-d8a5562b3b45';

update quiz_questions set
  question_en = 'According to Inspector Cabanel''s report (1882), how many bricks does the brickworks supply each month?',
  bonne_reponse_en = 'Between 60,000 and 75,000 bricks.',
  mauvaise_reponse_1_en = 'Between 20,000 and 30,000 bricks.',
  mauvaise_reponse_2_en = '220,000 bricks.'
  where id = 'b9c4b678-4fa2-44b0-9a55-b2a1f44f6274';
