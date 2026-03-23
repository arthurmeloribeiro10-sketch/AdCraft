-- Trend saves: stores user-generated and edited roteiros/copies per trend
create table if not exists trend_saves (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  trend_id     text not null,
  trend_nome   text not null,
  type         text not null check (type in ('roteiro', 'copy')),
  content      text not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One save per (user, trend, type) — upsert on conflict
create unique index if not exists trend_saves_user_trend_type
  on trend_saves (user_id, trend_id, type);

-- RLS
alter table trend_saves enable row level security;

create policy "Users manage own saves"
  on trend_saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_trend_saves_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trend_saves_updated_at
  before update on trend_saves
  for each row execute function update_trend_saves_timestamp();
