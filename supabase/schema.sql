-- =====================================================================
-- Mortal Supreme — Schema Supabase (PostgreSQL)
-- Single-user MVP. RLS deshabilitado por ahora; columnas owner_user_id
-- preparadas para migrar a multi-user sin reescribir.
-- Ejecutar todo en orden dentro del SQL Editor de Supabase.
-- =====================================================================

-- ----- Extensiones -----
create extension if not exists "unaccent";
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----- Función de normalización de nombres -----
-- IMMUTABLE para poder usarla en generated columns / índices.
-- unaccent() es STABLE por default; lo wrappeamos como IMMUTABLE
-- pasando el dictionary regdictionary explícito (truco estándar de Postgres).
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.unaccent('public.unaccent'::regdictionary, $1);
$$;

create or replace function public.normalize_name(input text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(trim(public.immutable_unaccent(input)));
$$;

-- ----- ENUMS -----
do $$ begin
  create type tournament_format as enum ('league', 'lightning');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tournament_status as enum ('setup', 'in_progress', 'finished', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type round_status as enum ('pending', 'in_progress', 'completed', 'aborted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type turn_status as enum ('pending', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_type as enum ('regular', 'tiebreaker', 'extra', 'final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('pending', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABLAS
-- =====================================================================

-- ----- players -----
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (public.normalize_name(name)) stored,
  owner_user_id uuid null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Unicidad de nombre normalizado por owner (hoy owner_user_id null para todos)
-- Esto soporta multi-user en el futuro sin romper el MVP.
create unique index if not exists players_owner_normalized_unique
  on public.players (coalesce(owner_user_id::text, '__SINGLE__'), normalized_name);

create index if not exists players_normalized_idx on public.players (normalized_name);
create index if not exists players_archived_idx on public.players (archived);

-- ----- tournaments -----
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format tournament_format not null default 'league',
  target_score int not null default 21,
  tables_count int not null check (tables_count >= 1),
  counts_for_history boolean not null default true,
  status tournament_status not null default 'setup',
  winner_player_id uuid null references public.players(id) on delete set null,
  winner_added_to_history boolean not null default false,
  owner_user_id uuid null,
  created_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists tournaments_status_idx on public.tournaments (status);
create index if not exists tournaments_created_idx on public.tournaments (created_at desc);

-- ----- tournament_players -----
create table if not exists public.tournament_players (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  points int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  rests int not null default 0,
  primary key (tournament_id, player_id)
);

create index if not exists tournament_players_player_idx on public.tournament_players (player_id);

-- ----- rounds -----
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number int not null,
  status round_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (tournament_id, round_number)
);

create index if not exists rounds_tournament_idx on public.rounds (tournament_id);

-- ----- turns -----
create table if not exists public.turns (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  turn_number int not null,
  resting_player_id uuid null references public.players(id) on delete set null,
  status turn_status not null default 'pending',
  unique (round_id, turn_number)
);

create index if not exists turns_round_idx on public.turns (round_id);

-- ----- matches -----
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_id uuid null references public.rounds(id) on delete set null,
  turn_id uuid null references public.turns(id) on delete set null,
  player1_id uuid not null references public.players(id) on delete restrict,
  player2_id uuid not null references public.players(id) on delete restrict,
  winner_id uuid null references public.players(id) on delete set null,
  table_number int null,
  match_type match_type not null default 'regular',
  status match_status not null default 'pending',
  played_at timestamptz null,
  created_at timestamptz not null default now(),
  check (player1_id <> player2_id),
  check (
    winner_id is null
    or winner_id = player1_id
    or winner_id = player2_id
  )
);

create index if not exists matches_tournament_idx on public.matches (tournament_id);
create index if not exists matches_round_idx on public.matches (round_id);
create index if not exists matches_turn_idx on public.matches (turn_id);
create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_p1_idx on public.matches (player1_id);
create index if not exists matches_p2_idx on public.matches (player2_id);

-- ----- history -----
create table if not exists public.history (
  player_id uuid primary key references public.players(id) on delete cascade,
  tournaments_won int not null default 0,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- VISTAS / FUNCIONES DE STATS
-- =====================================================================

-- Stats por jugador (total matches, wins, losses, win rate)
create or replace view public.v_player_stats as
with played as (
  select
    p.id as player_id,
    p.name,
    count(m.*) filter (where m.status = 'completed' and (m.player1_id = p.id or m.player2_id = p.id)) as total_matches,
    count(m.*) filter (where m.status = 'completed' and m.winner_id = p.id) as wins,
    count(m.*) filter (where m.status = 'completed' and (m.player1_id = p.id or m.player2_id = p.id) and m.winner_id is not null and m.winner_id <> p.id) as losses
  from public.players p
  left join public.matches m
    on (m.player1_id = p.id or m.player2_id = p.id)
   and m.status = 'completed'
  group by p.id, p.name
)
select
  pl.player_id,
  pl.name,
  pl.total_matches,
  pl.wins,
  pl.losses,
  case when pl.total_matches = 0 then 0
       else round(pl.wins::numeric / pl.total_matches::numeric, 4)
  end as win_rate,
  coalesce(h.tournaments_won, 0) as tournaments_won
from played pl
left join public.history h on h.player_id = pl.player_id;

-- Streak actual (ganados consecutivos hasta el último completado)
create or replace function public.player_current_streak(p_player_id uuid)
returns int
language sql
stable
as $$
  with ordered as (
    select
      m.played_at,
      case when m.winner_id = p_player_id then 1 else 0 end as won
    from public.matches m
    where m.status = 'completed'
      and (m.player1_id = p_player_id or m.player2_id = p_player_id)
      and m.played_at is not null
    order by m.played_at desc
  ),
  with_break as (
    select won,
           sum(case when won = 0 then 1 else 0 end) over (order by played_at desc rows between unbounded preceding and current row) as breaks
    from ordered
  )
  select coalesce(count(*) filter (where breaks = 0 and won = 1), 0)::int from with_break;
$$;

-- Head-to-head entre dos jugadores
create or replace function public.head_to_head(player_a uuid, player_b uuid)
returns table (a_wins int, b_wins int, total int)
language sql
stable
as $$
  select
    count(*) filter (where m.winner_id = player_a)::int as a_wins,
    count(*) filter (where m.winner_id = player_b)::int as b_wins,
    count(*)::int as total
  from public.matches m
  where m.status = 'completed'
    and (
      (m.player1_id = player_a and m.player2_id = player_b)
      or (m.player1_id = player_b and m.player2_id = player_a)
    );
$$;

-- =====================================================================
-- RLS — DESHABILITADO HOY (single-user MVP)
-- Cuando se active multi-user:
--   1) habilitar RLS en cada tabla
--   2) policies de owner_user_id = auth.uid()
-- =====================================================================
alter table public.players              disable row level security;
alter table public.tournaments          disable row level security;
alter table public.tournament_players   disable row level security;
alter table public.rounds               disable row level security;
alter table public.turns                disable row level security;
alter table public.matches              disable row level security;
alter table public.history              disable row level security;

-- =====================================================================
-- LISTO. Recordá generar tipos TS con:
--   supabase gen types typescript --project-id <REF> --schema public
-- y guardarlos en types/database.ts
-- =====================================================================
