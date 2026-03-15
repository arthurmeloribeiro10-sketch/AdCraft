-- Users workspace
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null default 'Meu Workspace',
  created_at timestamptz default now()
);

-- Scripts
create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  product text,
  audience text,
  platform text,
  template text,
  hook text,
  development text,
  demo text,
  reinforcement text,
  cta text,
  scenes jsonb,
  created_at timestamptz default now()
);

-- Copies
create table if not exists copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  product text,
  audience text,
  problem text,
  main_copy text,
  variations jsonb,
  headlines jsonb,
  ctas jsonb,
  created_at timestamptz default now()
);

-- Video analyses
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  video_url text,
  description text,
  hook_score int,
  retention_score int,
  clarity_score int,
  storytelling_score int,
  cta_score int,
  viral_score int,
  overall_score int,
  strengths jsonb,
  weaknesses jsonb,
  suggestions jsonb,
  created_at timestamptz default now()
);

-- Creative scores
create table if not exists creative_scores (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references analyses,
  user_id uuid references auth.users not null,
  score int,
  breakdown jsonb,
  created_at timestamptz default now()
);

-- Creative ideas
create table if not exists creative_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  niche text,
  product text,
  audience text,
  concept text,
  hook text,
  style text,
  description text,
  created_at timestamptz default now()
);

-- Winners library
create table if not exists winner_ads (
  id uuid primary key default gen_random_uuid(),
  creative_type text,
  niche text,
  format text,
  platform text,
  structure text,
  strategy text,
  why_works text,
  created_at timestamptz default now()
);

-- Trends
create table if not exists trends (
  id uuid primary key default gen_random_uuid(),
  format text,
  growth_pct int,
  hook_style text,
  description text,
  category text,
  created_at timestamptz default now()
);

-- RLS policies
alter table workspaces enable row level security;
alter table scripts enable row level security;
alter table copies enable row level security;
alter table analyses enable row level security;
alter table creative_ideas enable row level security;

create policy "users own workspace" on workspaces
  for all using (auth.uid() = user_id);

create policy "users own scripts" on scripts
  for all using (auth.uid() = user_id);

create policy "users own copies" on copies
  for all using (auth.uid() = user_id);

create policy "users own analyses" on analyses
  for all using (auth.uid() = user_id);

create policy "users own ideas" on creative_ideas
  for all using (auth.uid() = user_id);
