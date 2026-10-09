-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : retire les tirets cadratins du Boulevard du Crime
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

update point_sections set
  texte =
    'Au cœur du Camp Central, le Boulevard du Crime, surnom ironique donné par les forçats eux-mêmes, désigne l''allée menant à la cour des exécutions. C''est ici que la guillotine était dressée. Seuls les condamnés de la 4e classe assistaient aux exécutions : c''est eux qui montaient l''échafaud, enlevaient le corps, puis démontaient l''instrument de mort.',
  texte_en =
    'At the heart of the Camp Central, the Boulevard du Crime, an ironic nickname given by the convicts themselves, is the name for the path leading to the execution yard. This is where the guillotine was set up. Only fourth-class convicts attended executions: it was they who mounted the scaffold, removed the body, and then dismantled the instrument of death.'
where id = '27d68ade-9848-4528-b299-389185866487';

update temoignages set
  texte =
    '« L''exécution capitale se fait par la guillotine. Elle a lieu sur le terrain appelé vulgairement le boulevard du Crime ! Alors retentit le cri : Quatrième classe, genoux-terre ; ordre immédiatement exécuté par cinq à six cents hommes. Une minute après, la justice est satisfaite. »',
  texte_en =
    '"Capital execution is carried out by guillotine. It takes place on the ground commonly called the Boulevard du Crime! Then comes the cry: Fourth class, kneel down; an order obeyed at once by five to six hundred men. A minute later, justice is served."'
where point_id = 'boulevard_du_crime';
