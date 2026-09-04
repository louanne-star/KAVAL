-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Contenu : description du point "Camp Est"
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Remplace le résumé générique de camp_est_principal par le vrai texte
-- historique. C'est ce texte qui s'affiche tout en haut de la page détail
-- du point (juste sous le sous-titre de zone), avant Mini-jeu/Témoignage/Quiz.
-- ─────────────────────────────────────────────────────────────────────────────

update points
set description = 'Construit dès 1874 à la pointe sud de l''île Nou, le Camp Est regroupe cases dortoirs, prison, lavoir et logement du surveillant-chef. Son eau saumâtre, source de nombreuses dysenteries, oblige longtemps les condamnés à aller puiser à la Fontaine Bigard avant la construction d''une citerne. Le camp abrite aussi le redouté quartier disciplinaire, où les condamnés à temps comme les « berlingots » à perpétuité subissent un régime éprouvant (ration réduite, billots de bois, longues heures debout). C''est de là que le forçat Raoul Tellier tente en 1897 sa douzième évasion, rapidement échouée malgré une préparation minutieuse.'
where id = 'camp_est_principal';
