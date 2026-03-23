-- Extend trends table with rich intelligence fields
alter table trends
  add column if not exists nome text,
  add column if not exists plataforma text,
  add column if not exists tipo text,
  add column if not exists descricao text,
  add column if not exists por_que_viraliza text,
  add column if not exists como_usar text,
  add column if not exists copy_exemplo text,
  add column if not exists ideia_criativo text,
  add column if not exists nivel_viralidade int,
  add column if not exists potencial_conversao int,
  add column if not exists inputs_adcraft jsonb;

-- Index for efficient daily fetching
create index if not exists trends_created_at_idx on trends (created_at desc);
create index if not exists trends_plataforma_idx on trends (plataforma);
create index if not exists trends_potencial_conversao_idx on trends (potencial_conversao desc);
