-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : retire "Grand voleur" de l'accusation de
-- Pierre Chenevier (jeu Tribunal)
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- "Grand voleur" jugé inutile en ouverture de phrase (et son équivalent
-- anglais "A notorious thief").
-- ─────────────────────────────────────────────────────────────────────────────

update tribunal_dossiers set
  accusation    = 'Après plusieurs démêlés avec la justice, il est condamné à dix ans de travaux forcés.',
  accusation_en = 'After several run-ins with the law, he is sentenced to ten years of hard labour.'
where matricule = '#8005';
