-- =====================================================================
-- EvoluFit — exercícios, treinos e séries
-- =====================================================================

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  muscle_group public.muscle_group not null,
  equipment text check (equipment is null or char_length(btrim(equipment)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 1000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.exercises is 'Catálogo pessoal de exercícios.';

create index exercises_user_name_idx on public.exercises (user_id, lower(name));

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.workouts is 'Treino realizado em determinada data.';

create index workouts_user_date_idx on public.workouts (user_id, date desc);

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id uuid not null,
  exercise_id uuid not null,
  position integer not null check (position >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id) references public.exercises (id, user_id) on delete restrict
);

comment on table public.workout_exercises is 'Exercícios dentro de um treino.';

create index workout_exercises_workout_idx on public.workout_exercises (workout_id, user_id, position);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id, user_id);

-- ---------------------------------------------------------------------
create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_exercise_id uuid not null,
  set_number integer not null check (set_number between 1 and 100),
  -- carga total movimentada (ex.: 2 halteres de 10 kg = 20 kg); NULL = sem carga
  load_kg numeric(6, 2) check (load_kg >= 0 and load_kg < 1000),
  reps integer not null check (reps between 1 and 1000),
  is_warmup boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (workout_exercise_id, set_number),
  foreign key (workout_exercise_id, user_id) references public.workout_exercises (id, user_id) on delete cascade
);

comment on table public.exercise_sets is 'Séries individuais (fonte de verdade de carga e repetições).';
comment on column public.exercise_sets.load_kg is 'Carga total movimentada em kg. NULL para exercícios sem carga.';
comment on column public.exercise_sets.is_warmup is 'Aquecimento: fica no histórico, fora de totais, volume e progressão.';

create index exercise_sets_workout_exercise_idx on public.exercise_sets (workout_exercise_id, user_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_sets enable row level security;

create policy "exercises: ler os próprios" on public.exercises for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "exercises: inserir os próprios" on public.exercises for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "exercises: atualizar os próprios" on public.exercises for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exercises: excluir os próprios" on public.exercises for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "workouts: ler os próprios" on public.workouts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "workouts: inserir os próprios" on public.workouts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "workouts: atualizar os próprios" on public.workouts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workouts: excluir os próprios" on public.workouts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "workout_exercises: ler os próprios" on public.workout_exercises for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "workout_exercises: inserir os próprios" on public.workout_exercises for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "workout_exercises: atualizar os próprios" on public.workout_exercises for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_exercises: excluir os próprios" on public.workout_exercises for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "exercise_sets: ler as próprias" on public.exercise_sets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "exercise_sets: inserir as próprias" on public.exercise_sets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "exercise_sets: atualizar as próprias" on public.exercise_sets for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exercise_sets: excluir as próprias" on public.exercise_sets for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.exercises, public.workouts, public.workout_exercises, public.exercise_sets from anon;
grant select, insert, update, delete
  on public.exercises, public.workouts, public.workout_exercises, public.exercise_sets
  to authenticated;
