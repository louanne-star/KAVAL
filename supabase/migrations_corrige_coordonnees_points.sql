-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : correction des coordonnées GPS de 6 points
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Les coordonnées d'origine (migrations_points.sql) étaient approximatives —
-- le commentaire sur place indiquait même des coordonnées décalées/identiques
-- entre plusieurs points faute de données précises. Remplacées ici par les
-- coordonnées GPS réelles fournies (relevé terrain / Google Maps).
-- ─────────────────────────────────────────────────────────────────────────────

update points set lat = -22.259672, lng = 166.401592 where id = 'quartier_cellulaire';

update points set lat = -22.261400, lng = 166.403540 where id = 'hotel_du_commandant';

update points set lat = -22.261624, lng = 166.403280 where id = 'chateau_eau_tour_guet';

update points set lat = -22.260920, lng = 166.402990 where id = 'chapelle_saint_thomas';

-- 22°15'37.3"S 166°24'10.6"E
update points set lat = -22.260361, lng = 166.402944 where id = 'logement_surveillant_principal';

-- 22°15'38.1"S 166°24'08.5"E
update points set lat = -22.260583, lng = 166.402361 where id = 'boulevard_du_crime';

-- 22°15'41.0"S 166°24'05.8"E
update points set lat = -22.261389, lng = 166.401611 where id = 'logement_surveillants_1ere_classe';

update points set lat = -22.261540, lng = 166.404470 where id = 'caserne_infanterie';

update points set lat = -22.262520, lng = 166.403750 where id = 'batiment_officiers_administration';
