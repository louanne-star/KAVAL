-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : contenu du mini-jeu Mémoire du Bagne
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Jusqu'ici, les 5 paires du jeu (clé, libellé) étaient codées en dur dans
-- mini-jeux/memoire.html, et ses images chargées depuis le dossier local
-- assets/mini-jeux/img_memo/ — impossible à modifier sans redéploiement,
-- contrairement au reste du contenu de l'app. Même principe que les dossiers
-- du Tribunal (table tribunal_dossiers, bucket Storage "tribunal", voir
-- migrations_tribunal.sql) : la table ci-dessous pilote les paires, et les
-- images viennent du bucket Storage public "memoire" (à créer manuellement :
-- Dashboard > Storage > New bucket > nom "memoire", Public bucket : OUI).
--
-- Si la table est vide ou Supabase injoignable, le jeu retombe automatiquement
-- sur les 5 paires codées en dur (voir memoire.html) — il reste donc jouable
-- hors-ligne ou avant que ce script ait été exécuté.
--
-- Fichiers attendus dans le bucket "memoire" (à uploader manuellement, ce
-- sont les mêmes fichiers déjà embarqués dans assets/mini-jeux/img_memo/) :
--   verso.png, nacre.png, chaine.png, brique.png, chapelle.png, lampe.png
-- (plus de fond.png : le fond est désormais un dégradé animé dessiné en
-- canvas, comme dans tribunal.html, pas une photo.)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists memoire_paires (
  cle       text primary key,
  label     text not null,
  label_en  text,
  ordre     int  not null default 0
);

alter table memoire_paires enable row level security;

drop policy if exists "Lecture publique des paires du mémoire" on memoire_paires;
create policy "Lecture publique des paires du mémoire"
  on memoire_paires for select
  using (true);

insert into memoire_paires (cle, label, label_en, ordre) values
  ('nacre',    'Nacre',    'Mother-of-pearl', 1),
  ('chaine',   'Chaîne',   'Chain',           2),
  ('brique',   'Brique',   'Brick',           3),
  ('chapelle', 'Chapelle', 'Chapel',          4),
  ('lampe',    'Lampe',    'Lamp',            5)
on conflict (cle) do update set
  label = excluded.label, label_en = excluded.label_en, ordre = excluded.ordre;
