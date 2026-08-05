-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- AVANT : Authentication > Settings > Email Auth > "Confirm email" : OFF
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Badges (zones physiquement visitées) ─────────────────────────────────────

create table if not exists user_badges (
  user_id   uuid references auth.users not null,
  zone_id   text not null,
  earned_at timestamptz default now(),
  primary key (user_id, zone_id)
);

alter table user_badges enable row level security;

create policy "Chaque utilisateur gère ses badges"
  on user_badges for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Notes étoiles ─────────────────────────────────────────────────────────────

create table if not exists user_ratings (
  user_id    uuid references auth.users not null,
  zone_id    text not null,
  rating     integer check (rating between 1 and 5),
  updated_at timestamptz default now(),
  primary key (user_id, zone_id)
);

alter table user_ratings enable row level security;

create policy "Chaque utilisateur gère ses notes"
  on user_ratings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Commentaires ──────────────────────────────────────────────────────────────

create table if not exists user_comments (
  user_id    uuid references auth.users not null,
  zone_id    text not null,
  comment    text,
  updated_at timestamptz default now(),
  primary key (user_id, zone_id)
);

alter table user_comments enable row level security;

create policy "Chaque utilisateur gère ses commentaires"
  on user_comments for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Favoris ───────────────────────────────────────────────────────────────────

create table if not exists user_favorites (
  user_id uuid references auth.users not null,
  zone_id text not null,
  primary key (user_id, zone_id)
);

alter table user_favorites enable row level security;

create policy "Chaque utilisateur gère ses favoris"
  on user_favorites for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Suppression de compte (appelée via supabase.rpc) ─────────────────────────
-- security definer : s'exécute avec les droits admin mais uniquement sur auth.uid()

create or replace function delete_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from user_badges    where user_id = auth.uid();
  delete from user_ratings   where user_id = auth.uid();
  delete from user_comments  where user_id = auth.uid();
  delete from user_favorites where user_id = auth.uid();
  delete from auth.users     where id      = auth.uid();
end;
$$;

-- ── Storage : bucket avatars ──────────────────────────────────────────────────
-- À faire manuellement dans Dashboard > Storage > New bucket
--   Nom : avatars
--   Public : OUI (cocher "Public bucket")
