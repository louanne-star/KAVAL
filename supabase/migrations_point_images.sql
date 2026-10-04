-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : photos des points (galerie)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Les photos sont hébergées dans le bucket Storage public "photos" (déjà
-- créé). Cette table stocke uniquement le chemin du fichier dans ce bucket
-- (même principe que app_branding, voir migrations_branding.sql) — l'app
-- reconstruit l'URL publique complète via supabase.storage.from('photos')
-- .getPublicUrl(chemin). `ordre` contrôle l'ordre d'affichage dans la
-- galerie d'un point (plusieurs photos possibles par point).
--
-- N'inclut QUE les fichiers confirmés présents dans le bucket au moment de
-- la génération (vérifiés un par un via requête directe sur l'URL publique,
-- le endpoint de listing étant bloqué pour la clé anon). Les fichiers ci-
-- dessous ont échoué à l'import et ne sont donc PAS dans ce script :
--
--   intérieur du magasin des vivres_result.avif
--   communion à la chapelle île nou_result.avif
--   témoignage camp central_result.avif
--   hotel du commandant supérieur_result_result.avif
--   caserne des suveillants mariés_result.avif
--   couloir à la caserne des suveillants mariés_result.avif
--   garde indigènes devant la caserne des suveillants mariés_result.avif
--   la caserne des surveillants mariés_result.avif
--   la caserne des surveillants mariés2_result.avif
--   petite caserne des surveillant mariés_result_result.avif
--   condamné sur chantier parc a charbon_result_result.avif
--   parc à charbon_result.avif
--   allée de cocotier conduisant à l'hopital_result.avif
--   cabane à la vacherie_result.avif
--   macé devant son habitation à la vacherie_result.avif
--   case léproserie_result.avif
--   emplacement de la léproserie_result_result.avif
--
-- Point commun à ces 17 échecs : ce sont TOUS les noms contenant un accent
-- (é/à/è/î). L'API Storage les rejette avec "InvalidKey" — pas un problème
-- réseau ni un oubli, Supabase refuse ces caractères dans une clé d'objet.
-- Pour les récupérer : renommer les fichiers sans accent avant un nouvel
-- import (ex. "léproserie" -> "leproserie"), puis relancer la vérification.
--
-- 2 points n'existent pas encore dans la table `points` — leurs photos sont
-- bien dans le bucket mais ne peuvent pas être rattachées tant que le point
-- n'est pas créé (contrainte de clé étrangère) :
--   - "La boulangerie (la manutention)" : boulangerie_result.avif, boulangerie2_result.avif
--   - "Bâtiment H atelier"              : batiment en H des ateliers_result.avif,
--                                          batiment H_result.avif, IMG_4818_result_result.avif
--
-- Point ambigu à vérifier : la liste fournie distingue "La caserne des
-- surveillants mariés" et "Le logement des surveillants mariées", mais un
-- seul point existe en base pour les deux : logement_surveillants_militaires_maries.
-- Les deux groupes ont donc été fusionnés dessus. Comme les 6 photos du
-- premier groupe ont toutes un nom accentué (donc échouées), seule la photo
-- du second groupe (FE909B83...) est effectivement rattachée.
--
-- "lieu des execution_result_result.avif" (boulevard_du_crime) a été inclus
-- malgré le doute exprimé ("pas sûr") — à retirer toi-même si ce n'est pas
-- la bonne photo (DELETE FROM point_images WHERE chemin = 'lieu des execution_result_result.avif';).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists point_images (
  id       uuid primary key default gen_random_uuid(),
  point_id text not null references points(id),
  chemin   text not null,
  ordre    int  not null default 0
);

alter table point_images enable row level security;

drop policy if exists "Lecture publique des photos de point" on point_images;
create policy "Lecture publique des photos de point"
  on point_images for select
  using (true);

delete from point_images where point_id in (
  'magasin_a_vivre', 'chapelle_saint_thomas', 'quartier_cellulaire',
  'logement_surveillant_principal', 'hotel_du_commandant',
  'logement_surveillants_militaires_maries', 'briqueterie',
  'boulevard_du_crime', 'parc_a_charbon', 'hopital_du_marais',
  'la_vacherie_ferme', 'leproserie'
);

insert into point_images (point_id, chemin, ordre) values
  ('magasin_a_vivre',                          'magasin des vivres_result.avif',                   1),

  ('chapelle_saint_thomas',                     'chapelle saint thomas_result_result.avif',         1),
  ('chapelle_saint_thomas',                     'chapelle_result.avif',                             2),

  ('quartier_cellulaire',                       'camp central_result.avif',                         1),

  ('logement_surveillant_principal',            'logement du surveillant principal_result_result.avif', 1),

  ('hotel_du_commandant',                       '490E2220-96A9-4097-8A46-42EABE2E6F3B_result_result.avif', 1),
  ('hotel_du_commandant',                       'IMG_4821_result_result.avif',                      2),

  ('logement_surveillants_militaires_maries',   'FE909B83-06B7-40A6-9E5B-122531F6A3B7_result_result.avif', 1),

  ('briqueterie',                               'briqueterie_result.avif',                          1),

  ('boulevard_du_crime',                        'guillotine_result.avif',                           1),
  ('boulevard_du_crime',                        'lieu des execution_result_result.avif',             2),

  ('parc_a_charbon',                            '662A19A8-CD33-4A41-84FE-B821D05B1A11_result_result.avif', 1),

  ('hopital_du_marais',                         'cimetiere de l''hopital_result_result.avif',        1),
  ('hopital_du_marais',                         'hopital du marais extension_result_result.avif',    2),
  ('hopital_du_marais',                         'jardin de l''hopital du marais_result.avif',         3),

  ('la_vacherie_ferme',                         'la vacherie_result.avif',                           1),

  ('leproserie',                                'cases de la leproserie_result.avif',                1);
