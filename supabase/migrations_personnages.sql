-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : portraits de personnages historiques
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace le contenu codé en dur dans parcours.page.ts (carte "Portrait"
-- façon mini-jeu, qui ouvre un popup avec photo + histoire) par du vrai
-- contenu piloté depuis la base, comme temoignages/point_sections.
--
-- personnages        : 1 ligne par point (nom, sous-titre, photo + légende).
-- personnage_paragraphes : les paragraphes de son histoire, dans l'ordre
--   (`ordre`). `citation` = true affiche le paragraphe en encadré "citation"
--   dans le popup plutôt qu'en texte courant. `texte`/`texte_en` peuvent
--   contenir des balises <strong> pour mettre certains mots en gras.
--
-- point_id doit correspondre à l'id d'un point de type 'vrai' (table
-- points). Un point sans ligne dans `personnages` n'affiche simplement pas
-- la carte "Portrait".
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists personnages (
  point_id      text primary key references points(id),
  nom           text not null,
  nom_en        text,
  sous_titre    text,
  sous_titre_en text,
  photo         text,
  legende       text,
  legende_en    text
);

alter table personnages enable row level security;

drop policy if exists "Lecture publique des personnages" on personnages;
create policy "Lecture publique des personnages"
  on personnages for select
  using (true);

create table if not exists personnage_paragraphes (
  id       uuid primary key default gen_random_uuid(),
  point_id text not null references points(id),
  texte    text not null,
  texte_en text,
  citation boolean not null default false,
  ordre    int not null default 0
);

alter table personnage_paragraphes enable row level security;

drop policy if exists "Lecture publique des paragraphes de personnage" on personnage_paragraphes;
create policy "Lecture publique des paragraphes de personnage"
  on personnage_paragraphes for select
  using (true);

-- ── Seed : Raoul Tellier (Camp Est) ────────────────────────────────────────

insert into personnages (point_id, nom, nom_en, sous_titre, sous_titre_en, photo, legende, legende_en) values
  ('camp_est_principal',
   'Raoul Tellier, « Le Roi de l’Évasion »',
   'Raoul Tellier, “The Escape King”',
   'Matricule 13204. Condamné. Évadé récidiviste.',
   'Prisoner No. 13204. Convict. Repeat escapee.',
   'raoul tellier_result.avif',
   'Raoul Tellier, matricule 13 204. Collection Louis-Georges Viale.',
   'Raoul Tellier, prisoner No. 13,204. Louis-Georges Viale Collection.')
on conflict (point_id) do update set
  nom = excluded.nom, nom_en = excluded.nom_en,
  sous_titre = excluded.sous_titre, sous_titre_en = excluded.sous_titre_en,
  photo = excluded.photo, legende = excluded.legende, legende_en = excluded.legende_en;

delete from personnage_paragraphes where point_id = 'camp_est_principal';

insert into personnage_paragraphes (point_id, texte, texte_en, citation, ordre) values
  ('camp_est_principal',
   'Certains hommes se résignent. Raoul Tellier, lui, décide que non.',
   'Some men resign themselves. Raoul Tellier decided he would not.',
   false, 1),

  ('camp_est_principal',
   'Entre 1883 et 1931, il s’évade <strong>seize fois</strong> du bagne calédonien. Ses tentatives cumulées lui valent <strong>86 ans</strong> de travaux forcés supplémentaires. Mathématiquement, ses peines ne s’éteignent qu’en <strong>l’an 2000</strong>. La justice veut l’enterrer sous les condamnations, Tellier continue quand même.',
   'Between 1883 and 1931, he escaped the Caledonian penal colony <strong>sixteen times</strong>. His combined attempts earned him <strong>86 additional years</strong> of forced labour. Mathematically, his sentences would not expire until <strong>the year 2000</strong>. The justice system wanted to bury him under his convictions — Tellier kept going anyway.',
   false, 2),

  ('camp_est_principal',
   'Le 7 octobre 1897, sa <strong>douzième évasion</strong>. Au Camp Est, affecté à la carrière, il observe le gardien du canot depuis des semaines. Son plan : voler l’embarcation, doubler la fausse passe, atteindre la côte. <strong>Dix minutes d’avance</strong> sur la meute.',
   'On 7 October 1897, his <strong>twelfth escape</strong>. At Camp Est, assigned to the quarry, he had been watching the boat guard for weeks. His plan: steal the boat, round the false channel, reach the coast. <strong>Ten minutes ahead</strong> of the pack.',
   false, 3),

  ('camp_est_principal',
   'Ce qu’il n’avait pas calculé, c’est les Canaques :',
   'What he hadn’t factored in was the Kanak trackers:',
   false, 4),

  ('camp_est_principal',
   'Les Canaques n’avaient pas leur pareil et si les soldats n’avaient pas eu les Canaques, ils ne nous auraient pas eus. Ils étaient à la chasse. Elle ne fut pas longue.',
   'The Kanak trackers had no equal, and if the soldiers hadn’t had them, they would never have caught us. They were hunting us. It didn’t take long.',
   true, 5),

  ('camp_est_principal',
   'Repris. Un coup de sagaie dans les côtes, des coups de casse-tête. Il perd beaucoup de sang. <strong>Quatre ans</strong> de travaux forcés supplémentaires.',
   'Recaptured. A spear wound to the ribs, blows from a war club. He lost a lot of blood. <strong>Four more years</strong> of forced labour.',
   false, 6),

  ('camp_est_principal',
   'Mais ses deux plus longues évasions durent près de <strong>trois ans et demi</strong> chacune. La dernière, de novembre 1927 à janvier 1931, <strong>presque quatre ans de liberté</strong>, après plus de quarante ans de bagne.',
   'But his two longest escapes each lasted nearly <strong>three and a half years</strong>. The last, from November 1927 to January 1931, <strong>almost four years of freedom</strong>, after more than forty years in the penal colony.',
   false, 7),

  ('camp_est_principal',
   'Raoul Tellier ne s’est jamais vraiment évadé, la Nouvelle-Calédonie est une île. Mais il a refusé, plus que quiconque, de <strong>laisser le bagne lui appartenir</strong>.',
   'Raoul Tellier never truly escaped — New Caledonia is an island. But more than anyone, he refused to <strong>let the penal colony own him</strong>.',
   false, 8);

-- ─────────────────────────────────────────────────────────────────────────────
-- Pour ajouter un personnage à un autre point :
--
-- insert into personnages (point_id, nom, sous_titre, photo) values
--   ('four_a_chaux', 'Nom', 'Sous-titre', 'photo_result.avif');
-- insert into personnage_paragraphes (point_id, texte, citation, ordre) values
--   ('four_a_chaux', 'Premier paragraphe...', false, 1),
--   ('four_a_chaux', 'Une citation entre guillemets...', true, 2);
-- ─────────────────────────────────────────────────────────────────────────────
