-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : logo de l'application (branding)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Le logo est hébergé dans le bucket Storage public "branding" (à créer
-- manuellement : Dashboard > Storage > New bucket > nom "branding", Public
-- bucket : OUI). Cette table stocke uniquement le chemin du fichier dans ce
-- bucket (même principe que tribunal_dossiers pour les portraits, voir
-- migrations_tribunal.sql) — l'app reconstruit l'URL publique complète au
-- démarrage. Changer le logo revient à uploader un nouveau fichier dans le
-- bucket et mettre à jour la ligne correspondante ici : aucun redéploiement
-- de l'app n'est nécessaire.
--
-- Fichiers attendus dans ce bucket (à uploader manuellement) :
--   logo-blanc.png  — logo blanc sur fond transparent (écrans immersifs sombres :
--                      hero de l'onboarding, écran final)
--   logo-badge.png  — logo en badge (fond blanc, glyphe bleu marine KAVAL #173B63) :
--                      utilisé sur fond clair (carte, cluster équipe de l'onboarding)
-- Tant que la table est vide, une ligne manque, ou Supabase est injoignable
-- (hors-ligne), l'app retombe sur les fichiers inclus dans l'application
-- (assets/icon/logo-blanc.png et assets/icon/logo.png) — elle reste donc
-- fonctionnelle sans configuration ni réseau.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists app_branding (
  cle     text primary key,       -- 'logo_blanc' ou 'logo_badge'
  chemin  text not null           -- chemin dans le bucket Storage "branding"
);

alter table app_branding enable row level security;

drop policy if exists "Lecture publique du branding" on app_branding;
create policy "Lecture publique du branding"
  on app_branding for select
  using (true);

insert into app_branding (cle, chemin) values
  ('logo_blanc', 'logo-blanc.png'),
  ('logo_badge', 'logo-badge.png')
on conflict (cle) do update set chemin = excluded.chemin;
