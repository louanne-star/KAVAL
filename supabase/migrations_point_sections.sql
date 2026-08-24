-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : sections de texte sur la page détail d'un point
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- points.description est aussi affiché dans la petite fiche de la carte
-- (map.page.html, .sheet-desc) : ce n'est donc pas l'endroit pour du texte
-- long réservé à la page détail. point_sections est un contenu séparé,
-- affiché UNIQUEMENT sur la page détail d'un point (avant Mini-jeu/
-- Témoignage/Quiz), qui peut avoir 0, 1 ou plusieurs blocs titrés par point
-- (ex: "Histoire", "Guerre médicale", ...). `ordre` contrôle l'affichage.
--
-- Pour ajouter/modifier une section plus tard : édite directement les
-- lignes dans Table Editor > point_sections, aucun redéploiement de l'app
-- n'est nécessaire.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists point_sections (
  id       uuid primary key default gen_random_uuid(),
  point_id text not null references points(id),
  titre    text not null,
  texte    text not null,
  ordre    int  not null default 0
);

alter table point_sections enable row level security;

drop policy if exists "Lecture publique des sections de point" on point_sections;
create policy "Lecture publique des sections de point"
  on point_sections for select
  using (true);

-- ── Corrige points.description qui contenait par erreur le texte long ──────
-- (il est réaffiché dans la petite fiche de la carte, donc doit rester court)

update points set description = 'Centre pénitentiaire historique et point central de cette zone.'
where id = 'camp_est_principal';

update points set description = 'Complexe hospitalier incluant le quartier des aliénées et un cimetière situé sur la plage à proximité.'
where id = 'hopital_du_marais';

-- ── Seed : sections des pages détail ────────────────────────────────────────

insert into point_sections (point_id, titre, texte, ordre) values
  ('camp_est_principal', 'Histoire',
   'Construit dès 1874 à la pointe sud de l''île Nou, le Camp Est regroupe cases dortoirs, prison, lavoir et logement du surveillant-chef. Son eau saumâtre, source de nombreuses dysenteries, oblige longtemps les condamnés à aller puiser à la Fontaine Bigard avant la construction d''une citerne. Le camp abrite aussi le redouté quartier disciplinaire, où les condamnés à temps comme les « berlingots » à perpétuité subissent un régime éprouvant (ration réduite, billots de bois, longues heures debout). C''est de là que le forçat Raoul Tellier tente en 1897 sa douzième évasion, rapidement échouée malgré une préparation minutieuse.',
   1),

  ('hopital_du_marais', 'Histoire',
   'Il était considéré comme l''un des plus beaux établissements de la Pénitentiaire et servait de « véritable école de chirurgie pour les jeunes médecins coloniaux ».',
   1),

  ('hopital_du_marais', 'Guerre médicale',
   'Une tension constante existait entre l''administration et les forçats, ces derniers simulant des maladies (fièvres, ulcères, délire) à l''aide de plantes locales comme la pomme épineuse (Datura) ou le saint-bois pour échapper aux travaux forcés.',
   2)

on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pour ajouter une section à un autre point :
--
-- insert into point_sections (point_id, titre, texte, ordre) values
--   ('four_a_chaux', 'Un titre', 'Le texte de la section.', 1);
-- ─────────────────────────────────────────────────────────────────────────────
