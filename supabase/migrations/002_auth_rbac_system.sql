-- ============================================================
-- Migration 002: Auth, RBAC, Plans, Tokens, Audit Logging
-- ============================================================

-- ── Plans ─────────────────────────────────────────────────────────────────────
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('starter', 'pro', 'elite')),
  display_name text not null,
  api_limit_daily int not null default 10,
  api_limit_monthly int not null default 100,
  features jsonb not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  plan_id uuid references plans(id) on delete set null,
  is_active boolean not null default true,
  api_calls_today int not null default 0,
  api_calls_month int not null default 0,
  api_reset_daily timestamptz not null default (date_trunc('day', now()) + interval '1 day'),
  api_reset_monthly timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── User Tokens ───────────────────────────────────────────────────────────────
create table if not exists user_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  token_prefix text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Audit Logs ────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  actor_email text,
  target_user_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ── API Usage Logs ────────────────────────────────────────────────────────────
create table if not exists api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  endpoint text not null,
  tokens_used int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_plan_id_idx on profiles(plan_id);
create index if not exists audit_logs_actor_id_idx on audit_logs(actor_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);
create index if not exists audit_logs_action_idx on audit_logs(action);
create index if not exists api_usage_logs_user_id_created_at_idx on api_usage_logs(user_id, created_at desc);
create index if not exists user_tokens_user_id_idx on user_tokens(user_id);
create index if not exists user_tokens_token_hash_idx on user_tokens(token_hash);

-- ── Updated_at triggers ───────────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger plans_updated_at
  before update on plans
  for each row execute procedure update_updated_at_column();

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
declare
  starter_plan_id uuid;
begin
  select id into starter_plan_id from plans where name = 'starter' limit 1;

  insert into profiles (id, email, full_name, role, plan_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user',
    starter_plan_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Admin helper function ─────────────────────────────────────────────────────
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ── Check and reset API limits ────────────────────────────────────────────────
create or replace function check_and_reset_api_limits(p_user_id uuid)
returns table(
  api_calls_today int,
  api_calls_month int,
  daily_limit int,
  monthly_limit int,
  daily_reset_at timestamptz,
  monthly_reset_at timestamptz
) as $$
declare
  v_profile profiles%rowtype;
  v_plan plans%rowtype;
  v_now timestamptz := now();
  v_daily_reset boolean := false;
  v_monthly_reset boolean := false;
begin
  select * into v_profile from profiles where id = p_user_id;
  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.plan_id is not null then
    select * into v_plan from plans where id = v_profile.plan_id;
  end if;

  -- Reset daily counter if needed
  if v_now >= v_profile.api_reset_daily then
    v_daily_reset := true;
    update profiles
    set
      api_calls_today = 0,
      api_reset_daily = date_trunc('day', v_now) + interval '1 day'
    where id = p_user_id;
  end if;

  -- Reset monthly counter if needed
  if v_now >= v_profile.api_reset_monthly then
    v_monthly_reset := true;
    update profiles
    set
      api_calls_month = 0,
      api_reset_monthly = date_trunc('month', v_now) + interval '1 month'
    where id = p_user_id;
  end if;

  -- Refresh after potential resets
  select * into v_profile from profiles where id = p_user_id;

  return query select
    v_profile.api_calls_today,
    v_profile.api_calls_month,
    coalesce(v_plan.api_limit_daily, 10),
    coalesce(v_plan.api_limit_monthly, 100),
    v_profile.api_reset_daily,
    v_profile.api_reset_monthly;
end;
$$ language plpgsql security definer;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table plans enable row level security;
alter table profiles enable row level security;
alter table user_tokens enable row level security;
alter table audit_logs enable row level security;
alter table api_usage_logs enable row level security;

-- Plans: readable by all authenticated users
create policy "plans_select_authenticated" on plans
  for select to authenticated using (true);

-- Plans: only admin can modify
create policy "plans_modify_admin" on plans
  for all using (is_admin());

-- Profiles: user sees own row, admin sees all
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id or is_admin());

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id or is_admin());

create policy "profiles_delete_admin" on profiles
  for delete using (is_admin());

-- User tokens: own only (admin via service role)
create policy "user_tokens_own" on user_tokens
  for all using (auth.uid() = user_id or is_admin());

-- Audit logs: select admin only; insert open (to allow unauthenticated login-fail logging)
create policy "audit_logs_select_admin" on audit_logs
  for select using (is_admin());

create policy "audit_logs_insert_open" on audit_logs
  for insert with check (true);

-- API usage logs: user sees own, admin sees all
create policy "api_usage_logs_own" on api_usage_logs
  for select using (auth.uid() = user_id or is_admin());

create policy "api_usage_logs_insert_own" on api_usage_logs
  for insert with check (auth.uid() = user_id or is_admin());

-- ── Seed Plans ────────────────────────────────────────────────────────────────
insert into plans (name, display_name, api_limit_daily, api_limit_monthly, features, sort_order)
values
  (
    'starter',
    'Starter',
    10,
    100,
    '{
      "scriptGenerator": true,
      "copyGenerator": true,
      "videoAnalyzer": false,
      "creativeIdeas": false,
      "winnersLibrary": false,
      "trendsRadar": false,
      "projectHistory": true,
      "maxScripts": 10,
      "maxCopies": 10,
      "maxAnalyses": 0,
      "maxIdeas": 0
    }'::jsonb,
    0
  ),
  (
    'pro',
    'Pro',
    50,
    500,
    '{
      "scriptGenerator": true,
      "copyGenerator": true,
      "videoAnalyzer": true,
      "creativeIdeas": true,
      "winnersLibrary": true,
      "trendsRadar": false,
      "projectHistory": true,
      "maxScripts": 50,
      "maxCopies": 50,
      "maxAnalyses": 20,
      "maxIdeas": 20
    }'::jsonb,
    1
  ),
  (
    'elite',
    'Elite',
    200,
    2000,
    '{
      "scriptGenerator": true,
      "copyGenerator": true,
      "videoAnalyzer": true,
      "creativeIdeas": true,
      "winnersLibrary": true,
      "trendsRadar": true,
      "projectHistory": true,
      "maxScripts": -1,
      "maxCopies": -1,
      "maxAnalyses": -1,
      "maxIdeas": -1
    }'::jsonb,
    2
  )
on conflict (name) do update
  set
    display_name = excluded.display_name,
    api_limit_daily = excluded.api_limit_daily,
    api_limit_monthly = excluded.api_limit_monthly,
    features = excluded.features,
    sort_order = excluded.sort_order,
    updated_at = now();
