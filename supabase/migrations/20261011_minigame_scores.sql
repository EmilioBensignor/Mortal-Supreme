-- Highscores de los minijuegos para el que espera turno
create table if not exists public.minigame_scores (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  tournament_id uuid null references public.tournaments(id) on delete set null,
  score int not null,
  created_at timestamptz not null default now()
);

create index if not exists minigame_scores_game_score_idx on public.minigame_scores (game, score);

-- Grants Data API (la app usa anon, single-user MVP como el resto de las tablas)
grant select, insert on public.minigame_scores to anon;
grant select, insert, update, delete on public.minigame_scores to authenticated;
grant select, insert, update, delete on public.minigame_scores to service_role;

alter table public.minigame_scores disable row level security;
