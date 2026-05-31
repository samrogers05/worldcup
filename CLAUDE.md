# World Cup 2026 Family Predictions App

## Project Overview
A family World Cup prediction website where users predict scores for every game across the tournament. Points are awarded for correct result direction (1pt) and exact score (2pt total). Features a live leaderboard, community predictions viewer, and group standings predictor.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase (Postgres, RLS enabled)
- **Hosting**: Vercel
- **Auth**: None — users identify by name only, UUID persisted in localStorage
- **Styling**: Tailwind CSS

---

## Database Schema

### `users`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
created_at  timestamptz default now()
```

### `games`
```sql
id            uuid primary key default gen_random_uuid()
stage         text not null  -- 'group' | 'R16' | 'QF' | 'SF' | 'F'
group_name    text           -- 'A'–'L', null for knockout
home_team     text not null
away_team     text not null
kickoff_time  timestamptz
actual_home   int            -- null until admin enters result
actual_away   int            -- null until admin enters result
match_number  int            -- ordering within stage
created_at    timestamptz default now()
```

### `predictions`
```sql
id             uuid primary key default gen_random_uuid()
user_id        uuid references users(id)
game_id        uuid references games(id)
predicted_home int not null
predicted_away int not null
created_at     timestamptz default now()
updated_at     timestamptz default now()
unique(user_id, game_id)
```

### `settings`
```sql
key    text primary key   -- e.g. 'group_lock_time', 'r16_open', 'qf_open', etc.
value  text not null
```
Settings keys:
- `group_lock_time` — ISO timestamp, set by admin
- `r16_predictions_open` — 'true' | 'false'
- `qf_predictions_open` — 'true' | 'false'
- `sf_predictions_open` — 'true' | 'false'
- `f_predictions_open` — 'true' | 'false'
- `admin_password_hash` — bcrypt hash of admin password

---

## Scoring Logic

### Points per game
- **1pt** — correct result direction (home win / draw / away win)
- **1pt** — exact score match
- **Max 2pts per game**

### Stage breakdown
- Group stage: 48 games × 2pts = 96pts max
- R16: 16 games × 2pts = 32pts max
- QF: 8 games × 2pts = 16pts max
- SF: 4 games × 2pts = 8pts max
- Final: 1 game × 2pts = 2pts max
- **Tournament max: 154pts**

### Points computation
Computed live via Supabase query — no caching needed:
```sql
select
  u.id,
  u.name,
  sum(
    case when sign(p.predicted_home - p.predicted_away) = sign(g.actual_home - g.actual_away) then 1 else 0 end +
    case when p.predicted_home = g.actual_home and p.predicted_away = g.actual_away then 1 else 0 end
  ) as points,
  sum(case when g.stage = 'group' then ... end) as group_points,
  sum(case when g.stage != 'group' then ... end) as knockout_points
from predictions p
join games g on g.id = p.game_id
join users u on u.id = p.user_id
where g.actual_home is not null
group by u.id, u.name
```

### Max possible remaining
For each user: sum 2pts for every game they have a prediction for where `actual_home` is still null.

---

## Locking Logic

### Group stage
- Admin sets `group_lock_time` in settings
- Before lock: users can create/edit predictions for any group game
- After lock: predictions are read-only

### Knockout rounds
- Admin manually toggles `r16_predictions_open`, `qf_predictions_open`, etc. in the admin panel
- When a round is opened: users can submit predictions for that round's games
- When a round is closed: predictions locked for that round
- Knockout games are only populated in the `games` table once teams are known (admin enters them)

### Visibility rules
- **My Predictions**: always visible to the user (pre and post lock)
- **Community Predictions page**: visible only after group stage lock
- **Predicted Group Standings**: visible only after group stage lock
- **Actual scores on Community Predictions**: shown only after admin has entered the result for that game

---

## User Identity
- On first visit, user enters their name → a UUID is generated and stored in `localStorage` as `wc_user_id`, name stored as `wc_user_name`
- A new row is inserted into `users` table
- On return visit, UUID is read from localStorage and used to fetch/update their predictions
- If localStorage is cleared, user can re-enter same name (creates new UUID — acceptable for family use)

---

## Pages & Routes

### `/` — Home
- Enter name prompt if no localStorage UUID
- Summary card: your total points, rank, max possible remaining
- Mini leaderboard (top 5)
- Quick links to My Predictions and Community Predictions

### `/predict` — Group Stage Predictions
- Grid of all 48 games organized by group (A–L)
- Each game: score input (home score | away score), shows kickoff date
- Pre-lock: inputs editable, save button per group or global save
- Post-lock: inputs disabled, shows locked predictions
- Shows lock countdown timer if lock is in future

### `/predict/knockout` — Knockout Predictions
- Tabs for R16, QF, SF, Final
- Each round only shows if that round's prediction window is open OR if user has already submitted predictions for it
- If window is closed and no predictions submitted: shows "Predictions not yet open"
- If window is open: score inputs, save button
- If window is closed and predictions submitted: read-only view of own predictions

### `/leaderboard` — Live Leaderboard
- Filter tabs: **All** | **Group Stage** | **Knockout**
- Table columns: Rank | Name | Group Pts | Knockout Pts | Total Pts | Max Possible Remaining
- Click any user → drill-down modal or sub-page showing points per game
  - Each row: game (teams), stage, user's prediction, actual score (if played), points earned
  - Also filterable by Group / Knockout within drill-down
- Sorted by Total by default; re-sorts when filter tab changes

### `/community` — Community Predictions
- Only accessible after group stage lock
- Browse by stage (group / knockout) and by game
- Game selector: dropdown or card grid
- Per game view:
  - All users' predicted scores listed side by side
  - Actual score shown prominently once admin has entered it
  - Highlight correct predictions (green direction, gold for exact)
- Filter: All Stages | Group Stage | Knockout

### `/standings` — Predicted Group Standings
- Only accessible after group stage lock
- Tab for each group (A–L)
- For each group, shows a table per user of their predicted final group standings
  - Derived from their 6 game predictions for that group (W/D/L, GD, GF)
  - Sorted by predicted points then GD then GF
- Toggle between viewing one user at a time or all users side by side

### `/admin` — Admin Panel
- Password gate (bcrypt check against `admin_password_hash` in settings)
- Admin session stored in sessionStorage (cleared on tab close)
- Sections:
  1. **Tournament Lock** — set/edit `group_lock_time` datetime picker
  2. **Enter Group Results** — game list, score inputs, save per game
  3. **Knockout Round Management**
     - For each round (R16, QF, SF, Final):
       - Toggle prediction window open/closed
       - Enter teams for each game (once known)
       - Enter actual scores once played
  4. **Users** — list of all registered users, prediction counts

---

## Component Structure (suggested)
```
/app
  /page.tsx                  (Home)
  /predict/page.tsx          (Group stage predictions)
  /predict/knockout/page.tsx (Knockout predictions)
  /leaderboard/page.tsx      (Leaderboard + drill-down)
  /community/page.tsx        (Community predictions)
  /standings/page.tsx        (Predicted group standings)
  /admin/page.tsx            (Admin panel)

/components
  GameScoreInput.tsx         (Score input pair with validation)
  LeaderboardTable.tsx       (Sortable, filterable table)
  UserDrillDown.tsx          (Per-user game-by-game breakdown)
  CommunityGameView.tsx      (All predictions for one game)
  GroupStandingsTable.tsx    (Derived standings from predictions)
  PredictionLockBanner.tsx   (Countdown / locked state banner)
  AdminPasswordGate.tsx      (Password entry wrapper)
  StageFilterTabs.tsx        (All / Group / Knockout filter)

/lib
  supabase.ts                (Supabase client)
  scoring.ts                 (Points calculation helpers)
  standings.ts               (Derive group table from predictions)
  settings.ts                (Read/write settings helpers)
  auth.ts                    (Admin password check, localStorage helpers)

/data
  wc2026-groups.ts           (Static: all 48 group games with teams, dates, groups)
```

---

## 2026 World Cup Data

### Groups (12 groups of 4, 48 games)
Seed the `games` table with all 48 group stage games on setup. The fixture list for the 2026 FIFA World Cup group stage is publicly available — use the confirmed schedule with kickoff times in local time zones converted to UTC.

Groups: A through L, 4 teams each, each team plays 3 games, 6 games per group.

Tournament start: **June 11, 2026**

### Knockout structure
- R16: 16 games (winners/runners-up from groups, standard FIFA bracket)
- QF: 8 games
- SF: 4 games
- Third place play-off: 1 game (optional — add as bonus, no prediction required)
- Final: 1 game

Knockout games are created in the DB by the admin once teams are confirmed.

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, for admin operations
```

---

## Supabase RLS Policies

### `predictions` table
- SELECT: allow all (reads are public post-lock; enforce lock in app layer)
- INSERT: allow if `user_id` matches a valid user
- UPDATE: allow if `user_id` matches the row's `user_id`

### `games` table
- SELECT: allow all
- INSERT/UPDATE: service role only (admin operations via server action)

### `users` table
- SELECT: allow all
- INSERT: allow (anyone can register a name)

### `settings` table
- SELECT: allow all
- UPDATE: service role only

---

## Key Implementation Notes

1. **Group standings derivation**: Calculate predicted standings purely from the user's 6 predictions per group. For each game: award 3pts win / 1pt draw / 0pts loss to each team, track GF/GA/GD. Sort by pts → GD → GF. Tiebreaker: head-to-head (predicted score between tied teams).

2. **Knockout game population**: When admin enters teams for a knockout game, update the existing placeholder row in `games` (created with TBD teams) rather than inserting new rows, so prediction foreign keys remain stable.

3. **Score input validation**: Only allow integers 0–20. Prevent negative numbers. Both fields required before saving.

4. **Lock enforcement**: Enforce lock both client-side (disable inputs) and by checking `group_lock_time` in server actions before any prediction write.

5. **Max possible remaining**: For unplayed games where a user has a prediction = 2pts each. For unplayed games where a user has NO prediction yet = 0pts (can't predict after lock). Show this prominently on leaderboard.

6. **First visit flow**: If no `wc_user_id` in localStorage, show a name entry modal on home page. Validate name is non-empty and not already taken (check `users` table). Store UUID + name in localStorage on success.

7. **Admin password**: Store as bcrypt hash in `settings` table. Check via a Next.js server action (never expose to client). On success, store `admin_session=true` in sessionStorage with an expiry timestamp.

8. **Predicted group standings page**: Allow toggling between "all users side by side" (columns = users, rows = positions 1–4) and "one user deep-dive" (full points/GD/GF table for selected user).
