-- ============================================================
-- World Cup 2026 — Group Stage Fixture Seed
-- ============================================================
-- 12 groups × 6 games = 72 group stage games total.
-- NOTE: CLAUDE.md references "48 group games" (old 32-team format).
-- The 2026 format has 48 teams in 12 groups → 72 group stage games.
-- Points max: 72 × 2 = 144 (group) + 58 (knockout) = 202 total.
--
-- All kickoff times are UTC. Source: fwclive.com + worldcupwiki.com,
-- cross-referenced June 2026. ET times converted to UTC (EDT = UTC-4).
-- match_number is the global chronological sequence number.
-- ============================================================

insert into games (stage, group_name, home_team, away_team, kickoff_time, match_number) values

-- ----------------------------------------------------------------
-- GROUP A: Mexico · South Korea · Czechia · South Africa
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'A', 'Mexico',      'South Africa', '2026-06-11T19:00:00Z',  1),
('group', 'A', 'South Korea', 'Czechia',       '2026-06-12T02:00:00Z',  2),
-- Matchday 2
('group', 'A', 'Czechia',     'South Africa', '2026-06-18T16:00:00Z', 25),
('group', 'A', 'Mexico',      'South Korea',  '2026-06-19T01:00:00Z', 28),
-- Matchday 3 (simultaneous)
('group', 'A', 'Czechia',     'Mexico',        '2026-06-25T01:00:00Z', 53),
('group', 'A', 'South Africa','South Korea',   '2026-06-25T01:00:00Z', 54),

-- ----------------------------------------------------------------
-- GROUP B: Canada · Bosnia & Herzegovina · Qatar · Switzerland
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'B', 'Canada',              'Bosnia & Herzegovina', '2026-06-12T19:00:00Z',  3),
('group', 'B', 'Qatar',               'Switzerland',          '2026-06-13T19:00:00Z',  5),
-- Matchday 2
('group', 'B', 'Switzerland',         'Bosnia & Herzegovina', '2026-06-18T19:00:00Z', 26),
('group', 'B', 'Canada',              'Qatar',                '2026-06-18T22:00:00Z', 27),
-- Matchday 3 (simultaneous)
('group', 'B', 'Switzerland',         'Canada',               '2026-06-24T19:00:00Z', 49),
('group', 'B', 'Bosnia & Herzegovina','Qatar',                '2026-06-24T19:00:00Z', 50),

-- ----------------------------------------------------------------
-- GROUP C: Brazil · Morocco · Haiti · Scotland
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'C', 'Brazil',   'Morocco',  '2026-06-13T22:00:00Z',  6),
('group', 'C', 'Haiti',    'Scotland', '2026-06-14T01:00:00Z',  7),
-- Matchday 2
('group', 'C', 'Scotland', 'Morocco',  '2026-06-19T22:00:00Z', 30),
('group', 'C', 'Brazil',   'Haiti',    '2026-06-20T00:30:00Z', 31),
-- Matchday 3 (simultaneous)
('group', 'C', 'Scotland', 'Brazil',   '2026-06-24T22:00:00Z', 51),
('group', 'C', 'Morocco',  'Haiti',    '2026-06-24T22:00:00Z', 52),

-- ----------------------------------------------------------------
-- GROUP D: USA · Paraguay · Australia · Türkiye
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'D', 'USA',       'Paraguay',  '2026-06-13T01:00:00Z',  4),
('group', 'D', 'Australia', 'Türkiye',   '2026-06-14T04:00:00Z',  8),
-- Matchday 2
('group', 'D', 'USA',       'Australia', '2026-06-19T19:00:00Z', 29),
('group', 'D', 'Türkiye',   'Paraguay',  '2026-06-20T03:00:00Z', 32),
-- Matchday 3 (simultaneous)
('group', 'D', 'Türkiye',   'USA',       '2026-06-26T02:00:00Z', 59),
('group', 'D', 'Paraguay',  'Australia', '2026-06-26T02:00:00Z', 60),

-- ----------------------------------------------------------------
-- GROUP E: Germany · Ecuador · Ivory Coast · Curacao
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'E', 'Germany',     'Curacao',     '2026-06-14T17:00:00Z',  9),
('group', 'E', 'Ivory Coast', 'Ecuador',     '2026-06-14T23:00:00Z', 11),
-- Matchday 2
('group', 'E', 'Germany',     'Ivory Coast', '2026-06-20T20:00:00Z', 34),
('group', 'E', 'Ecuador',     'Curacao',     '2026-06-21T00:00:00Z', 35),
-- Matchday 3 (simultaneous)
('group', 'E', 'Curacao',     'Ivory Coast', '2026-06-25T20:00:00Z', 55),
('group', 'E', 'Ecuador',     'Germany',     '2026-06-25T20:00:00Z', 56),

-- ----------------------------------------------------------------
-- GROUP F: Netherlands · Japan · Sweden · Tunisia
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'F', 'Netherlands', 'Japan',        '2026-06-14T20:00:00Z', 10),
('group', 'F', 'Sweden',      'Tunisia',      '2026-06-15T02:00:00Z', 12),
-- Matchday 2
('group', 'F', 'Netherlands', 'Sweden',       '2026-06-20T17:00:00Z', 33),
('group', 'F', 'Tunisia',     'Japan',        '2026-06-21T04:00:00Z', 36),
-- Matchday 3 (simultaneous)
('group', 'F', 'Japan',       'Sweden',       '2026-06-25T23:00:00Z', 57),
('group', 'F', 'Tunisia',     'Netherlands',  '2026-06-25T23:00:00Z', 58),

-- ----------------------------------------------------------------
-- GROUP G: Belgium · Egypt · Iran · New Zealand
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'G', 'Belgium',     'Egypt',        '2026-06-15T19:00:00Z', 14),
('group', 'G', 'Iran',        'New Zealand',  '2026-06-16T01:00:00Z', 16),
-- Matchday 2
('group', 'G', 'Belgium',     'Iran',         '2026-06-21T19:00:00Z', 38),
('group', 'G', 'New Zealand', 'Egypt',        '2026-06-22T01:00:00Z', 40),
-- Matchday 3 (simultaneous)
('group', 'G', 'Egypt',       'Iran',         '2026-06-27T03:00:00Z', 63),
('group', 'G', 'New Zealand', 'Belgium',      '2026-06-27T03:00:00Z', 64),

-- ----------------------------------------------------------------
-- GROUP H: Spain · Cape Verde · Saudi Arabia · Uruguay
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'H', 'Spain',       'Cape Verde',   '2026-06-15T16:00:00Z', 13),
('group', 'H', 'Saudi Arabia','Uruguay',      '2026-06-15T22:00:00Z', 15),
-- Matchday 2
('group', 'H', 'Spain',       'Saudi Arabia', '2026-06-21T16:00:00Z', 37),
('group', 'H', 'Uruguay',     'Cape Verde',   '2026-06-21T22:00:00Z', 39),
-- Matchday 3 (simultaneous)
('group', 'H', 'Cape Verde',  'Saudi Arabia', '2026-06-27T00:00:00Z', 65),
('group', 'H', 'Uruguay',     'Spain',        '2026-06-27T00:00:00Z', 66),

-- ----------------------------------------------------------------
-- GROUP I: France · Senegal · Iraq · Norway
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'I', 'France', 'Senegal', '2026-06-16T19:00:00Z', 17),
('group', 'I', 'Iraq',   'Norway',  '2026-06-16T22:00:00Z', 18),
-- Matchday 2
('group', 'I', 'France', 'Iraq',    '2026-06-22T21:00:00Z', 42),
('group', 'I', 'Norway', 'Senegal', '2026-06-23T00:00:00Z', 43),
-- Matchday 3 (simultaneous)
('group', 'I', 'Norway', 'France',  '2026-06-26T19:00:00Z', 61),
('group', 'I', 'Senegal','Iraq',    '2026-06-26T19:00:00Z', 62),

-- ----------------------------------------------------------------
-- GROUP J: Argentina · Algeria · Austria · Jordan
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'J', 'Argentina', 'Algeria', '2026-06-17T01:00:00Z', 19),
('group', 'J', 'Austria',   'Jordan',  '2026-06-17T04:00:00Z', 20),
-- Matchday 2
('group', 'J', 'Argentina', 'Austria', '2026-06-22T17:00:00Z', 41),
('group', 'J', 'Jordan',    'Algeria', '2026-06-23T03:00:00Z', 44),
-- Matchday 3 (simultaneous)
('group', 'J', 'Algeria',   'Austria', '2026-06-28T02:00:00Z', 69),
('group', 'J', 'Jordan',    'Argentina','2026-06-28T02:00:00Z', 70),

-- ----------------------------------------------------------------
-- GROUP K: Portugal · DR Congo · Uzbekistan · Colombia
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'K', 'Portugal',  'DR Congo',   '2026-06-17T17:00:00Z', 21),
('group', 'K', 'Uzbekistan','Colombia',   '2026-06-18T02:00:00Z', 24),
-- Matchday 2
('group', 'K', 'Portugal',  'Uzbekistan', '2026-06-23T17:00:00Z', 45),
('group', 'K', 'Colombia',  'DR Congo',   '2026-06-24T02:00:00Z', 48),
-- Matchday 3 (simultaneous)
('group', 'K', 'Colombia',  'Portugal',   '2026-06-27T23:30:00Z', 71),
('group', 'K', 'DR Congo',  'Uzbekistan', '2026-06-27T23:30:00Z', 72),

-- ----------------------------------------------------------------
-- GROUP L: England · Croatia · Ghana · Panama
-- ----------------------------------------------------------------
-- Matchday 1
('group', 'L', 'England', 'Croatia', '2026-06-17T20:00:00Z', 22),
('group', 'L', 'Ghana',   'Panama',  '2026-06-17T23:00:00Z', 23),
-- Matchday 2
('group', 'L', 'England', 'Ghana',   '2026-06-23T20:00:00Z', 46),
('group', 'L', 'Panama',  'Croatia', '2026-06-23T23:00:00Z', 47),
-- Matchday 3 (simultaneous)
('group', 'L', 'Panama',  'England', '2026-06-27T21:00:00Z', 67),
('group', 'L', 'Croatia', 'Ghana',   '2026-06-27T21:00:00Z', 68);
