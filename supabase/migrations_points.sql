-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : contenu des zones et points
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace les zones/points factices codés en dur dans l'app par un vrai
-- contenu piloté depuis la base de données. L'app charge ces deux tables au
-- démarrage (lecture publique, anon key) et les met en cache localement pour
-- fonctionner hors-ligne. Pour modifier/ajouter un point plus tard : édite
-- directement les lignes dans Table Editor > points, aucun redéploiement
-- de l'app n'est nécessaire.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Zones (regroupement visuel : couleur + icône, pas de logique badge) ──────

create table if not exists zones (
  id         text primary key,
  nom        text not null,
  sous_titre text not null,
  couleur    text not null,
  icone      text not null,
  ordre      int  not null
);

alter table zones enable row level security;

drop policy if exists "Lecture publique des zones" on zones;
create policy "Lecture publique des zones"
  on zones for select
  using (true);

-- ── Points (vrai point = badge + itinéraire ; popup = infos au clic) ────────

create table if not exists points (
  id          text primary key,
  zone_id     text not null references zones(id),
  type        text not null check (type in ('vrai', 'popup')),
  nom         text not null,
  description text not null,
  lat         double precision not null,
  lng         double precision not null,
  rayon       int  default 25,            -- rayon d'arrivée en mètres (vrai points uniquement, null pour les popups)
  icone       text,                        -- emoji (popups uniquement)
  ordre       int
);

alter table points enable row level security;

drop policy if exists "Lecture publique des points" on points;
create policy "Lecture publique des points"
  on points for select
  using (true);

-- ── Seed : zones ──────────────────────────────────────────────────────────────

insert into zones (id, nom, sous_titre, couleur, icone, ordre) values
  ('camp_est',    'Le Camp Est',            'Carrière & industrie',    '#e74c3c', '⛏️', 1),
  ('vacherie',    'La Vacherie',            'Agriculture & libérés',   '#9b59b6', '🌾', 2),
  ('hopital',     'L''Hôpital du Marais',   'Soins & chapelle',        '#3498db', '✝️', 3),
  ('ferme_nord',  'La Ferme Nord',          'Phare & léproserie',      '#f39c12', '🌊', 4),
  ('penitencier', 'La Zone Pénitentiaire',  'Cœur du bagne',           '#27ae60', '🗝️', 5)
on conflict (id) do update set
  nom = excluded.nom, sous_titre = excluded.sous_titre,
  couleur = excluded.couleur, icone = excluded.icone, ordre = excluded.ordre;

-- ── Seed : points ─────────────────────────────────────────────────────────────
-- Note coordonnées : plusieurs points fournis partageaient des coordonnées
-- identiques (bâtiments regroupés dans la Zone Pénitentiaire) ; ils ont été
-- légèrement décalés (quelques mètres) pour que les marqueurs ne se
-- superposent pas sur la carte.

insert into points (id, zone_id, type, nom, description, lat, lng, rayon, icone, ordre) values

  -- Zone 1 : Camp Est
  ('camp_est_principal', 'camp_est', 'vrai',
   'Camp Est',
   'Centre pénitentiaire historique et point central de cette zone.',
   -22.271302, 166.425924, 30, null, 1),

  ('parc_a_charbon', 'camp_est', 'popup',
   'Parc à charbon',
   'Situé derrière la chapelle ; il ne reste plus rien aujourd''hui de cette installation.',
   -22.274401, 166.426432, null, '🪨', null),

  ('four_a_chaux', 'camp_est', 'vrai',
   'Four à chaux',
   'Vestiges d''un mur témoignant de l''activité industrielle passée.',
   -22.280361, 166.426826, 30, null, 2),

  ('carriere', 'camp_est', 'popup',
   'Carrière',
   'Site d''extraction situé sur la montagne. Il ne reste plus rien à voir aujourd''hui.',
   -22.281620, 166.426558, null, '⛏️', null),

  -- Zone 2 : Vacherie (uniquement des popups — plus rien à voir sur place)
  ('cimetiere_surveillants_militaires', 'vacherie', 'popup',
   'Cimetière des surveillants militaires',
   'Situé au Lycée Jules Garnier, vers le dôme. Il ne reste plus rien à voir aujourd''hui.',
   -22.267423, 166.420846, null, '🪦', null),

  ('case_des_liberes', 'vacherie', 'popup',
   'Case des libérés',
   'Bâtiment historique situé au niveau du CFA actuel. Il ne reste plus rien à voir aujourd''hui.',
   -22.267526, 166.415062, null, '🏚️', null),

  ('la_vacherie_ferme', 'vacherie', 'popup',
   'La Vacherie (Ferme)',
   'Ancienne ferme de la pénitence, aujourd''hui intégrée au foyer Reznik dans le CFA. Il ne reste plus rien à voir aujourd''hui.',
   -22.268096, 166.413682, null, '🐄', null),

  -- Zone 3 : Hôpital du Marais
  ('magasin_a_vivre', 'hopital', 'vrai',
   'Magasin à vivre (Théâtre de l''Île)',
   'Ancien lieu de stockage des denrées, transformé aujourd''hui en théâtre.',
   -22.262159, 166.400758, 25, null, 3),

  ('briqueterie', 'hopital', 'vrai',
   'Briqueterie',
   'Lieu de fabrication de briques à partir de l''argile extraite des marais environnants.',
   -22.263269, 166.399772, 25, null, 4),

  ('jardin_hopital_logement_surveillant', 'hopital', 'popup',
   'Jardin de l''hôpital et Logement du surveillant',
   'Zone de culture de légumes pour les malades et logement situé en bas du campus (Bâtiment Q).',
   -22.263629, 166.400390, null, '🌿', null),

  ('hopital_du_marais', 'hopital', 'vrai',
   'Hôpital du Marais',
   'Complexe hospitalier incluant le quartier des aliénées et un cimetière situé sur la plage à proximité.',
   -22.268141, 166.397851, 30, null, 5),

    -- Zone 4 : Ferme Nord (uniquement des popups)
  ('ferme_nord_luzerne', 'ferme_nord', 'popup',
   'Ferme Nord (Champs de luzerne)',
   'Ancienne zone agricole pour la culture de luzerne et emplacement de la léproserie.',
   -22.260141, 166.393176, null, '🌾', null),

  ('village_des_liberes', 'ferme_nord', 'popup',
   'Village des libérés',
   'Lieu d''installation pour les anciens bagnards ayant terminé leur peine.',
   -22.256244, 166.391591, null, '🏘️', null),

  ('leproserie', 'ferme_nord', 'popup',
   'Léproserie',
   'Lieu où tous les bagnards atteints de la lèpre étaient regroupés.',
   -22.247817, 166.391289, null, '⚕️', null),

  -- Zone 5 : Zone Pénitentiaire
  ('caserne_infanterie', 'penitencier', 'vrai',
   'Caserne d''infanterie (Quartier militaire)',
   'Bâtiments de cantonnement pour les forces militaires de surveillance.',
   -22.261676, 166.404108, 25, null, 6),

  ('ecole_primaire_surveillants', 'penitencier', 'popup',
   'École primaire des enfants des surveillants',
   'Établissement scolaire destiné aux familles du personnel de surveillance. Il ne reste plus rien à voir aujourd''hui.',
   -22.261666, 166.403460, null, '🏫', null),

  -- Décalé de qq mètres : coordonnées identiques à "Logement des surveillants de 1ère classe" dans les données fournies
  ('batiment_officiers_administration', 'penitencier', 'vrai',
   'Bâtiment des officiers d''administration',
   'Siège administratif de la gestion pénitentiaire.',
   -22.261502, 166.401170, 20, null, 7),

  ('logement_surveillants_1ere_classe', 'penitencier', 'vrai',
   'Logement des surveillants de 1ère classe',
   'Habitations réservées aux gardiens gradés.',
   -22.261342, 166.401370, 20, null, 8),

  -- Décalé de qq mètres : coordonnées identiques à "Quartier cellulaire" dans les données fournies
  ('logement_surveillants_militaires_maries', 'penitencier', 'vrai',
   'Logement des surveillants militaires mariés',
   'Quartiers d''habitation pour les familles des surveillants militaires.',
   -22.260830, 166.402205, 20, null, 9),

  ('quartier_cellulaire', 'penitencier', 'vrai',
   'Quartier cellulaire (240 cellules et 14 cachots)',
   'La zone de haute sécurité pour la détention individuelle et les punitions.',
   -22.260670, 166.402405, 20, null, 10),

  ('boulevard_du_crime', 'penitencier', 'vrai',
   'Boulevard du Crime',
   'Zone comprenant les cases dortoirs des condamnés.',
   -22.260688, 166.402862, 25, null, 11),

  ('logement_surveillant_principal', 'penitencier', 'vrai',
   'Logement du surveillant principal',
   'Résidence de fonction du responsable de la surveillance.',
   -22.260931, 166.402907, 20, null, 12),

  -- Décalés de qq mètres : coordonnées identiques entre ces 3 points dans les données fournies
  ('chapelle_saint_thomas', 'penitencier', 'vrai',
   'Chapelle Saint-Thomas et Presbytère',
   'Centre religieux de la colonie pénitentiaire.',
   -22.261345, 166.403898, 20, null, 13),

  ('chateau_eau_tour_guet', 'penitencier', 'vrai',
   'Château d''Eau et Tour de guet',
   'Infrastructures pour l''approvisionnement en eau et la surveillance panoramique.',
   -22.261545, 166.403798, 20, null, 14),

  ('hotel_du_commandant', 'penitencier', 'vrai',
   'Hôtel du Commandant',
   'Demeure officielle du directeur du bagne.',
   -22.261545, 166.403998, 20, null, 15)

on conflict (id) do update set
  zone_id = excluded.zone_id, type = excluded.type, nom = excluded.nom,
  description = excluded.description, lat = excluded.lat, lng = excluded.lng,
  rayon = excluded.rayon, icone = excluded.icone, ordre = excluded.ordre;

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONNEL — à lancer séparément et volontairement seulement :
-- les anciens badges/notes/commentaires/favoris factices référencent les
-- anciens id de zones (camp_est, vacherie, hopital, penitencier, ferme_nord)
-- qui n'existent plus comme points. Si tu veux repartir sur une base propre :
--
-- truncate user_badges, user_ratings, user_comments, user_favorites;
-- ─────────────────────────────────────────────────────────────────────────────
