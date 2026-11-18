-- =====================================================================
-- EvoluFit — acompanhamento diário (peso, água, observação)
-- =====================================================================

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  water_ml integer check (water_ml >= 0 and water_ml <= 20000),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- no máximo um registro por usuário e por data
  unique (user_id, date),
  -- exige pelo menos peso ou água
  constraint daily_checkins_weight_or_water check (weight_kg is not null or water_ml is not null)
);

comment on table public.daily_checkins is 'Peso, água e observações diárias.';
comment on column public.daily_checkins.water_ml is 'Total de água do dia em mililitros.';

create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

alter table public.daily_checkins enable row level security;

create policy "daily_checkins: ler os próprios" on public.daily_checkins for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "daily_checkins: inserir os próprios" on public.daily_checkins for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "daily_checkins: atualizar os próprios" on public.daily_checkins for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_checkins: excluir os próprios" on public.daily_checkins for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.daily_checkins from anon;
grant select, insert, update, delete on public.daily_checkins to authenticated;
