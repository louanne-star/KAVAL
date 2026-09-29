-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : équipe (bulles de l'écran "Un projet collaboratif")
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Même principe que tribunal_dossiers (voir migrations_tribunal.sql) et
-- app_branding (voir migrations_branding.sql) : les photos sont hébergées
-- dans le bucket Storage public "equipe" (à créer manuellement : Dashboard >
-- Storage > New bucket > nom "equipe", Public bucket : OUI), cette table
-- stocke uniquement le chemin du fichier dans ce bucket. L'app charge cette
-- table au démarrage et affiche une bulle photo par membre actif, dans
-- l'ordre. Ajouter/retirer un membre ou changer une photo ne nécessite
-- aucun redéploiement de l'app.
--
-- Tant que la table est vide, une ligne n'a pas encore sa photo uploadée, ou
-- Supabase est injoignable (hors-ligne), l'écran retombe sur une silhouette
-- générique à la place de la bulle manquante — l'app reste donc utilisable
-- sans configuration ni réseau.
--
-- Fichiers à uploader manuellement dans ce bucket (fournis à part) :
--   membre-1.png, membre-2.png, membre-3.png, membre-4.png, membre-5.png
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists equipe_membres (
  id     uuid primary key default gen_random_uuid(),
  nom    text,                        -- pas affiché dans l'onboarding pour l'instant, gardé pour référence
  photo  text not null,               -- chemin dans le bucket Storage "equipe"
  ordre  int  not null,
  actif  boolean not null default true
);

alter table equipe_membres enable row level security;

drop policy if exists "Lecture publique de l'équipe" on equipe_membres;
create policy "Lecture publique de l'équipe"
  on equipe_membres for select
  using (true);

insert into equipe_membres (nom, photo, ordre) values
  (null, 'membre-1.png', 1),
  (null, 'membre-2.png', 2),
  (null, 'membre-3.png', 3),
  (null, 'membre-4.png', 4),
  (null, 'membre-5.png', 5)
on conflict do nothing;
