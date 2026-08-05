-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : contenu du jeu "Le Tribunal du Bagne"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Le jeu (mini-jeux/tribunal.html) charge cette table au démarrage (lecture
-- publique, anon key) et tire 3 dossiers au hasard parmi les lignes actives.
-- Pour ajouter/modifier un dossier plus tard : édite directement les lignes
-- dans Table Editor > tribunal_dossiers, aucun redéploiement du jeu n'est
-- nécessaire.
--
-- Les images (photo détourée du bagnard) sont hébergées dans le bucket
-- Storage public "tribunal" (à créer manuellement : Dashboard > Storage >
-- New bucket > nom "tribunal", Public bucket : OUI). Cette table stocke
-- uniquement le chemin du fichier dans ce bucket (ex: 'vasseur.png'), le jeu
-- reconstruit l'URL publique complète. Les 3 images de tampons
-- (TRANSPORTÉ/DÉPORTÉ/RELÉGUÉ) sont fixes et attendues dans le même bucket,
-- sous-dossier "tampons/" (tampons/transporte.png, tampons/deporte.png,
-- tampons/relegue.png) — elles ne changent pas d'un dossier à l'autre donc
-- ne sont pas dans cette table.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists tribunal_dossiers (
  id            uuid primary key default gen_random_uuid(),
  matricule     text not null,
  nom           text not null,
  age           int  not null,
  accusation    text not null,
  bonne_reponse text not null check (bonne_reponse in ('TRANSPORTÉ', 'DEPORTÉ', 'RELÉGUÉ')),
  explication   text not null,
  photo         text,                        -- chemin dans le bucket Storage "tribunal", ex: 'vasseur.png'
  actif         boolean not null default true
);

alter table tribunal_dossiers enable row level security;

drop policy if exists "Lecture publique des dossiers du tribunal" on tribunal_dossiers;
create policy "Lecture publique des dossiers du tribunal"
  on tribunal_dossiers for select
  using (true);

-- ── Seed : reprend les 8 dossiers qui étaient codés en dur dans le jeu ────────
-- photo laissée vide : à compléter avec le nom du fichier une fois les
-- portraits détourés uploadés dans le bucket Storage "tribunal".

insert into tribunal_dossiers (matricule, nom, age, accusation, bonne_reponse, explication) values
  ('#4021', 'Pierre VASSEUR', 34,
   'A publié et diffusé des textes appelant à la rébellion armée contre le gouvernement.',
   'DEPORTÉ',
   'La diffusion de textes séditieux était un crime politique grave, puni de déportation dans une enceinte fortifiée.'),

  ('#1872', 'Jean-Baptiste MOREAU', 28,
   'Reconnu coupable de meurtre avec préméditation sur un officier de gendarmerie.',
   'DEPORTÉ',
   'Le meurtre d''un représentant de l''ordre entraînait la déportation définitive dans une enceinte fortifiée.'),

  ('#3304', 'Auguste LEFÈVRE', 45,
   'Condamné pour vol avec effraction. C''est sa 4e condamnation pour des faits similaires.',
   'RELÉGUÉ',
   'La récidive répétée de crimes mineurs comme le vol entraînait la relégation aux colonies.'),

  ('#5519', 'Henri DUBOIS', 22,
   'A participé activement aux combats de l''insurrection de la Commune de Paris en 1871.',
   'TRANSPORTÉ',
   'Les communards étaient transportés en Nouvelle-Calédonie — ils pouvaient rentrer après avoir purgé leur peine.'),

  ('#2087', 'Louise MARTIN', 31,
   'A mis le feu à plusieurs bâtiments publics lors des émeutes de 1871 à Paris.',
   'DEPORTÉ',
   'L''incendie volontaire de biens publics était un acte grave puni de déportation définitive.'),

  ('#6643', 'Marcel BERNARD', 19,
   'Arrêté pour la 5e fois pour vagabondage et mendicité agressive sur la voie publique.',
   'RELÉGUÉ',
   'Le vagabondage chronique et la mendicité répétée menaient à la relégation pour éloigner les indésirables.'),

  ('#0934', 'Émile ROUSSEAU', 52,
   'Reconnu coupable d''avoir transmis des secrets militaires à une puissance étrangère.',
   'DEPORTÉ',
   'L''espionnage était un crime politique très grave, systématiquement puni de déportation.'),

  ('#7751', 'François PETIT', 37,
   'A falsifié à plusieurs reprises des documents officiels pour escroquer des citoyens.',
   'RELÉGUÉ',
   'La falsification de documents sans violence, en cas de récidive, menait généralement à la relégation.')
on conflict do nothing;
