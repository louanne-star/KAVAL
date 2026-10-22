-- Variante "grande photo" pour la popup personnage (demandée pour le futur
-- personnage "Le tambour aveugle" sur le point boulevard_du_crime, en gardant
-- Raoul Tellier sur l'affichage actuel : petit portrait à côté du nom).
alter table personnages add column if not exists photo_grande boolean not null default false;

-- La fiche du personnage "Le tambour aveugle" (nom, sous-titre, légende de la
-- photo et texte biographique) sera insérée une fois le contenu fourni.
-- Gabarit à compléter :
--
-- insert into personnages (point_id, nom, nom_en, sous_titre, sous_titre_en, photo, legende, legende_en, photo_grande) values
-- ('boulevard_du_crime', '<nom>', '<name>', '<sous-titre>', '<subtitle>', 'camp central - le tambour aveugle_result_result.avif', '<légende photo>', '<photo caption>', true);
--
-- insert into personnage_paragraphes (point_id, texte, texte_en, citation, ordre) values
-- ('boulevard_du_crime', '<paragraphe 1>', '<paragraph 1>', false, 1);
