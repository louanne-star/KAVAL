-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : témoignages historiques
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace le témoignage codé en dur dans parcours.page.ts par du vrai
-- contenu piloté depuis la base de données, comme pour zones/points.
-- L'app charge cette table au démarrage (lecture publique, anon key) et la
-- met en cache localement pour fonctionner hors-ligne. Pour ajouter/modifier
-- un témoignage plus tard : édite directement les lignes dans
-- Table Editor > temoignages, aucun redéploiement de l'app n'est nécessaire.
--
-- point_id doit correspondre à l'id d'un point de type 'vrai' (table
-- points) : c'est sur la page détail de ce point que le témoignage
-- s'affichera. Un point sans ligne ici n'affiche simplement pas la carte
-- "Témoignage".
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists temoignages (
  point_id text primary key references points(id),
  titre    text not null,
  auteur   text not null,
  texte    text not null
);

alter table temoignages enable row level security;

drop policy if exists "Lecture publique des témoignages" on temoignages;
create policy "Lecture publique des témoignages"
  on temoignages for select
  using (true);

-- ── Seed : témoignage existant (Camp Est) ──────────────────────────────────

insert into temoignages (point_id, titre, auteur, texte) values
  ('camp_est_principal',
   'L''Enfer du Camp Est',
   'Lucien Jossevel, forçat suisse',
   'Dépouillés de toute dignité, vêtus de simples toiles de sac et entravés par de lourds fers aux pieds, les condamnés subissent un châtiment impitoyable. Du lever au coucher du soleil, affamés par des rations de survie diminuées de moitié, ils sont forcés de marcher en rond dans une salle à une cadence effrénée, tels des chevaux de manège. Mais l''horreur culmine lors des courtes minutes de répit. Ce soi-disant repos est une véritable torture psychologique et physique : obligés de s''asseoir dans un silence de mort sur des billots de bois verticaux atrocement étroits, la douleur est telle que le bagnard avoue qu''on « ferait mieux de les empaler ». Une descente aux enfers où la pause devient un supplice encore pire que l''effort.')
on conflict (point_id) do update set
  titre = excluded.titre, auteur = excluded.auteur, texte = excluded.texte;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pour ajouter un témoignage à un autre point, insère simplement une nouvelle
-- ligne, par exemple :
--
-- insert into temoignages (point_id, titre, auteur, texte) values
--   ('four_a_chaux', 'Titre du témoignage', 'Nom, statut de la personne', 'Le texte du témoignage...');
-- ─────────────────────────────────────────────────────────────────────────────
