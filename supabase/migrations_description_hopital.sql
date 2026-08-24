-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Contenu : description du point "Hôpital du Marais"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace le résumé générique de hopital_du_marais par le vrai texte
-- historique. C'est ce texte qui s'affiche dans la carte "Histoire" en haut
-- de la page détail du point (avant Mini-jeu/Témoignage/Quiz).
-- ─────────────────────────────────────────────────────────────────────────────

update points
set description = 'Il était considéré comme l''un des plus beaux établissements de la Pénitentiaire et servait de « véritable école de chirurgie pour les jeunes médecins coloniaux ». Une tension constante existait entre l''administration et les forçats, ces derniers simulant des maladies (fièvres, ulcères, délire) à l''aide de plantes locales comme la pomme épineuse (Datura) ou le saint-bois pour échapper aux travaux forcés.'
where id = 'hopital_du_marais';
