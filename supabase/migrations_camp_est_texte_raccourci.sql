-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : raccourcit le texte Histoire + témoignage du
-- point Camp Est
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'Construit dès 1874 à la pointe sud de l''île Nou, le Camp Est abrite cases-dortoirs, prison et le redouté quartier disciplinaire. Son eau saumâtre cause de nombreuses dysenteries, une citerne sera finalement construite après des années de rapports médicaux. C''est de là que le forçat Raoul Tellier tente en 1897 sa douzième évasion, rapidement échouée malgré une préparation minutieuse.',
  texte_en =
    'Built from 1874 at the southern tip of Île Nou, Camp Est housed dormitory huts, a prison and the feared disciplinary quarter. Its brackish water caused frequent dysentery; a water tank was finally built after years of medical reports. It was from there that convict Raoul Tellier attempted his twelfth escape in 1897, which quickly failed despite meticulous preparation.'
where id = '4495259a-7694-44b0-a7ec-4d1a30df4415';

update temoignages set
  texte =
    'Du lever au coucher du soleil, affamés, ils sont forcés de marcher en rond à cadence effrénée, tels des chevaux de manège. Lors des courtes minutes de répit, ils s''assoient sur des billots de bois verticaux atrocement étroits, on ferait mieux de les empaler. La pause devient un supplice pire que l''effort.',
  texte_en =
    'From sunrise to sunset, starving, they were forced to walk in circles at a frantic pace, like carousel horses. During the short minutes of respite, they sat on excruciatingly narrow vertical wooden blocks, one would be better off impaled. The pause became a torment worse than the labour itself.'
where point_id = 'camp_est_principal';
