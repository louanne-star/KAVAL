-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Traduction anglaise du jeu "Le Tribunal du Bagne"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- (à exécuter APRÈS migrations_tribunal_v2.sql, qui a inséré les 5 dossiers)
--
-- Ajoute deux colonnes optionnelles (accusation_en, explication_en) et les
-- renseigne pour les 5 dossiers existants. Le jeu (tribunal.html) les utilise
-- quand la langue de l'app est "en" (sinon il retombe sur le texte français).
-- ─────────────────────────────────────────────────────────────────────────────

alter table tribunal_dossiers add column if not exists accusation_en  text;
alter table tribunal_dossiers add column if not exists explication_en text;

update tribunal_dossiers set
  accusation_en  = 'An educated young man and fervent republican, he opposes the Empire and takes part in the Paris Commune in 1871.',
  explication_en = 'Communards were tried for a political crime against the State: Théophile Cacot was deported in 1872. Released from his sentence under mandatory residency, he is among the few Communards to settle permanently in New Caledonia.'
where matricule = '#8001';

update tribunal_dossiers set
  accusation_en  = 'A photographer by trade, he rebels against France to demand the independence of Vietnam, his native land that had become French Indochina.',
  explication_en = 'Anticolonial revolt was tried as a political crime against the State: Ca-Lê Ngoc Lien was deported to New Caledonia in 1914 and would never see his native Tonkin again. He rebuilt his life in Nouméa as a photographer.'
where matricule = '#8002';

update tribunal_dossiers set
  accusation_en  = 'A Pole from Volhynia, he is convicted in 1867 of "attempted premeditated murder of His Majesty the Emperor of Russia."',
  explication_en = 'Committed on French soil against a foreign head of state rather than against France itself, the attack was tried as an ordinary crime: Antoine Berezowski was transported for life to New Caledonia in 1868, not deported. He would end his days on Île Nou in 1916.'
where matricule = '#8003';

update tribunal_dossiers set
  accusation_en  = 'Sentenced to hard labour for theft, she arrives at the penal colony in 1881.',
  explication_en = 'Many women convicted of theft were relegated to the colonies, a measure aimed especially at the poorest repeat offenders. Marie Paillard would rebuild her life from the north to the south of the mainland.'
where matricule = '#8004';

update tribunal_dossiers set
  accusation_en  = 'A notorious thief, after several run-ins with the law, he is sentenced to ten years of hard labour.',
  explication_en = 'No sooner free, Pierre Chenevier serves a second term in the penal colony, then a third: repeated theft offences led to relegation, a measure of permanent banishment for multiple reoffenders.'
where matricule = '#8005';
