-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration récompense de fin de parcours (gamification)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Principe : chaque mini-jeu gagné (pas juste visité — voir plus bas) est
-- enregistré dans user_games_won. Dès qu'un joueur a gagné TOUS les points
-- listés dans mini_jeux_points, un déclencheur (trigger) lui crée
-- automatiquement une récompense avec un code unique, affichée en QR code
-- dans l'app. Le personnel du musée scanne ce QR avec son propre téléphone,
-- entre le PIN interne, et valide — le code devient alors à usage unique.
--
-- IMPORTANT — différence avec user_badges : un badge s'obtient soit en
-- gagnant le mini-jeu, soit simplement en marchant jusqu'au point (arrivée
-- GPS, voir map.page.ts). user_games_won n'est rempli QUE par le message
-- "jeuTermine" envoyé par l'iframe du mini-jeu une fois gagné — c'est le
-- seul signal fiable que le joueur a vraiment joué et gagné.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Config : quels points ont un mini-jeu ──────────────────────────────────
-- Table plutôt que valeur codée en dur : pour ajouter un 5ᵉ mini-jeu plus
-- tard, il suffira d'un INSERT ici, sans toucher au trigger ni au code app.

create table if not exists mini_jeux_points (
  point_id text primary key
);

insert into mini_jeux_points (point_id) values
  ('camp_est_principal'),
  ('magasin_a_vivre'),
  ('boulangerie'),
  ('hopital_du_marais')
on conflict (point_id) do nothing;

alter table mini_jeux_points enable row level security;

create policy "Lecture publique de la config mini-jeux"
  on mini_jeux_points for select
  using (true);

-- ── 2. Mini-jeux effectivement gagnés par chaque utilisateur ──────────────────

create table if not exists user_games_won (
  user_id  uuid references auth.users not null,
  point_id text not null,
  won_at   timestamptz default now(),
  primary key (user_id, point_id)
);

alter table user_games_won enable row level security;

create policy "Chaque utilisateur gère ses jeux gagnés"
  on user_games_won for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. Récompenses ──────────────────────────────────────────────────────────
-- Pas d'INSERT/UPDATE direct autorisé ici pour les utilisateurs : seul le
-- trigger (ci-dessous) et la fonction redeem_reward peuvent écrire, pour
-- qu'un utilisateur ne puisse pas se fabriquer ou valider sa propre entrée.

create table if not exists recompenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null unique,
  code        text unique not null,
  pseudo      text,
  cree_le     timestamptz default now(),
  utilisee_le timestamptz
);

alter table recompenses enable row level security;

create policy "Chaque utilisateur voit sa récompense"
  on recompenses for select
  using (auth.uid() = user_id);

-- ── 4. Déclencheur : crée la récompense dès que tous les jeux sont gagnés ────

create or replace function verifier_recompense_complete()
returns trigger
language plpgsql
security definer
as $$
declare
  v_total  integer;
  v_gagnes integer;
  v_pseudo text;
  v_code   text;
begin
  select count(*) into v_total from mini_jeux_points;

  select count(distinct ugw.point_id) into v_gagnes
    from user_games_won ugw
    join mini_jeux_points mjp on mjp.point_id = ugw.point_id
   where ugw.user_id = new.user_id;

  if v_gagnes < v_total then
    return new;
  end if;

  if exists (select 1 from recompenses where user_id = new.user_id) then
    return new;
  end if;

  select coalesce(raw_user_meta_data->>'username', 'Explorateur') into v_pseudo
    from auth.users where id = new.user_id;

  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into recompenses (user_id, code, pseudo)
  values (new.user_id, v_code, v_pseudo);

  return new;
end;
$$;

drop trigger if exists trg_verifier_recompense on user_games_won;
create trigger trg_verifier_recompense
  after insert on user_games_won
  for each row
  execute function verifier_recompense_complete();

-- ── 5. Fonctions pour la page de vérification (personnel du musée) ──────────
-- Appelées en anon (le personnel n'est pas connecté sur le compte du
-- visiteur) : security definer pour contourner la RLS de la table recompenses.

-- Statut du code, sans le PIN — affiché dès que la page se charge.
create or replace function get_reward_status(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row recompenses%rowtype;
begin
  select * into v_row from recompenses where code = upper(p_code);

  if v_row.id is null then
    return jsonb_build_object('trouve', false);
  end if;

  return jsonb_build_object(
    'trouve',      true,
    'pseudo',      v_row.pseudo,
    'utilisee',    v_row.utilisee_le is not null,
    'utilisee_le', v_row.utilisee_le
  );
end;
$$;

-- CHANGEZ CE PIN avant la mise en prod, et transmettez-le au personnel du musée.
create or replace function redeem_reward(p_code text, p_pin text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_pin constant text := 'KAVAL2026';
  v_row recompenses%rowtype;
begin
  if p_pin is distinct from v_pin then
    return jsonb_build_object('ok', false, 'erreur', 'pin_invalide');
  end if;

  select * into v_row from recompenses where code = upper(p_code);

  if v_row.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'code_introuvable');
  end if;

  if v_row.utilisee_le is not null then
    return jsonb_build_object(
      'ok', false, 'erreur', 'deja_utilisee',
      'pseudo', v_row.pseudo, 'utilisee_le', v_row.utilisee_le
    );
  end if;

  update recompenses set utilisee_le = now() where id = v_row.id;

  return jsonb_build_object('ok', true, 'pseudo', v_row.pseudo);
end;
$$;

grant execute on function get_reward_status(text)       to anon, authenticated;
grant execute on function redeem_reward(text, text)      to anon, authenticated;

-- ── 6. Suppression de compte : nettoyer aussi ces deux tables ────────────────
-- Redéfinit delete_account() (voir migrations.sql) en ajoutant les deux
-- nouvelles tables aux suppressions existantes.

create or replace function delete_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from user_badges     where user_id = auth.uid();
  delete from user_ratings    where user_id = auth.uid();
  delete from user_comments   where user_id = auth.uid();
  delete from user_favorites  where user_id = auth.uid();
  delete from user_games_won  where user_id = auth.uid();
  delete from recompenses     where user_id = auth.uid();
  delete from auth.users      where id      = auth.uid();
end;
$$;
