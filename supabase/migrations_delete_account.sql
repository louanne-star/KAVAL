-- Fonction manquante en base : le bouton "Supprimer le compte" de l'app
-- l'appelle via supabase.rpc('delete_account'), mais elle n'existait pas
-- côté serveur (confirmé en l'appelant directement : PGRST202 "function
-- not found"). À exécuter une fois dans le SQL Editor de Supabase.

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
