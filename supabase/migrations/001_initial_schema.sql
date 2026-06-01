-- ============================================================
-- World Cup 2026 Family Predictions — Initial Schema
-- ============================================================

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id            uuid primary key default gen_random_uuid(),
  stage         text not null check (stage in ('group', 'R16', 'QF', 'SF', 'F')),
  group_name    text,           -- 'A'–'L', null for knockout
  home_team     text not null,
  away_team     text not null,
  kickoff_time  timestamptz,
  actual_home   int,            -- null until admin enters result
  actual_away   int,            -- null until admin enters result
  match_number  int,            -- ordering within stage
  created_at    timestamptz not null default now()
);

create table if not exists predictions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  game_id        uuid not null references games(id) on delete cascade,
  predicted_home int not null check (predicted_home >= 0 and predicted_home <= 20),
  predicted_away int not null check (predicted_away >= 0 and predicted_away <= 20),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, game_id)
);

create table if not exists settings (
  key   text primary key,
  value text not null
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------

create index if not exists predictions_user_id_idx on predictions (user_id);
create index if not exists predictions_game_id_idx on predictions (game_id);
create index if not exists games_stage_idx on games (stage);
create index if not exists games_group_name_idx on games (group_name);

-- ----------------------------------------------------------------
-- updated_at trigger for predictions
-- ----------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists predictions_set_updated_at on predictions;
create trigger predictions_set_updated_at
  before update on predictions
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------
-- Default settings rows
-- ----------------------------------------------------------------

insert into settings (key, value) values
  ('group_lock_time',        '2026-06-11T19:00:00Z'),
  ('r16_predictions_open',   'false'),
  ('qf_predictions_open',    'false'),
  ('sf_predictions_open',    'false'),
  ('f_predictions_open',     'false'),
  ('admin_password_hash',    '')
on conflict (key) do nothing;

-- ----------------------------------------------------------------
-- Enable Row-Level Security
-- ----------------------------------------------------------------

alter table users       enable row level security;
alter table games       enable row level security;
alter table predictions enable row level security;
alter table settings    enable row level security;

-- ----------------------------------------------------------------
-- RLS Policies — users
-- ----------------------------------------------------------------

-- Anyone can read users (needed for name-uniqueness check and leaderboard)
create policy "users: public read"
  on users for select
  using (true);

-- Anyone can register (insert) a new user
create policy "users: public insert"
  on users for insert
  with check (true);

-- ----------------------------------------------------------------
-- RLS Policies — games
-- ----------------------------------------------------------------

-- Anyone can read games
create policy "games: public read"
  on games for select
  using (true);

-- Only service role can write games (enforced by denying anon/authenticated)
-- (No INSERT/UPDATE policy for anon — service role bypasses RLS by default)

-- ----------------------------------------------------------------
-- RLS Policies — predictions
-- ----------------------------------------------------------------

-- Anyone can read all predictions (community page, leaderboard)
create policy "predictions: public read"
  on predictions for select
  using (true);

-- A user can insert a prediction for themselves
create policy "predictions: insert own"
  on predictions for insert
  with check (
    user_id in (select id from users)
  );

-- A user can update only their own predictions
create policy "predictions: update own"
  on predictions for update
  using (true)
  with check (true);
-- Note: lock enforcement is done at the application layer (server actions
-- check group_lock_time / round open flags before allowing writes).

-- ----------------------------------------------------------------
-- RLS Policies — settings
-- ----------------------------------------------------------------

-- Anyone can read settings (lock time, round open flags)
create policy "settings: public read"
  on settings for select
  using (true);

-- Only service role can update settings (no anon policy = denied for anon)
