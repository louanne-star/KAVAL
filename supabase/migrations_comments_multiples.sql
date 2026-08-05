-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration commentaires multiples (à coller APRÈS migrations_community.sql)
-- Supabase Dashboard > SQL Editor > New query > Run
--
-- Avant : un seul commentaire par utilisateur et par zone (primary key
-- (user_id, zone_id)) — republier écrasait l'ancien.
-- Après : chaque publication crée une nouvelle ligne, un même utilisateur
-- peut donc laisser plusieurs commentaires sur le même point.
-- ─────────────────────────────────────────────────────────────────────────────

alter table user_comments drop constraint if exists user_comments_pkey;

alter table user_comments add column if not exists id uuid default gen_random_uuid();
update user_comments set id = gen_random_uuid() where id is null;
alter table user_comments alter column id set not null;
alter table user_comments add primary key (id);
