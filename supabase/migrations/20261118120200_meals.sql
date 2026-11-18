-- =====================================================================
-- EvoluFit — refeições do dia
-- =====================================================================

create table public.daily_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  meal_type public.meal_type not null,
  custom_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  -- 'personalizada' exige nome; os demais tipos não têm nome próprio
  constraint daily_meals_custom_name check (
    (meal_type = 'personalizada' and custom_name is not null and char_length(btrim(custom_name)) between 1 and 60)
    or (meal_type <> 'personalizada' and custom_name is null)
  )
);

comment on table public.daily_meals is 'Uma refeição registrada em uma data.';

create index daily_meals_user_date_idx on public.daily_meals (user_id, date);

create trigger daily_meals_set_updated_at
  before update on public.daily_meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- daily_meal_items: alimento OU receita, com snapshot nutricional
-- ---------------------------------------------------------------------
create table public.daily_meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_id uuid not null,
  food_id uuid,
  recipe_id uuid,
  quantity numeric(10, 3) not null check (quantity > 0),
  unit public.quantity_unit not null,
  position integer not null default 0 check (position >= 0),
  -- Snapshot calculado no momento do consumo. Preserva o histórico se o
  -- cadastro do alimento/receita for corrigido depois.
  name_snapshot text not null check (char_length(name_snapshot) between 1 and 120),
  calories numeric(10, 2) not null check (calories >= 0),
  carbs_g numeric(10, 2) check (carbs_g >= 0),
  protein_g numeric(10, 2) check (protein_g >= 0),
  fiber_g numeric(10, 2) check (fiber_g >= 0),
  fat_g numeric(10, 2) check (fat_g >= 0),
  saturated_fat_g numeric(10, 2) check (saturated_fat_g >= 0),
  sodium_mg numeric(10, 2) check (sodium_mg >= 0),
  -- Nutrientes sem dado em ao menos um componente (total parcial).
  -- NULL no valor = nenhum componente tinha o nutriente.
  incomplete_nutrients text[] not null default '{}' check (
    incomplete_nutrients <@ array['carbs_g', 'protein_g', 'fiber_g', 'fat_g', 'saturated_fat_g', 'sodium_mg']
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_meal_items_one_source check ((food_id is null) <> (recipe_id is null)),
  -- receitas são lançadas em porções; alimentos, em g/ml/unidade
  constraint daily_meal_items_unit_by_source check ((recipe_id is not null) = (unit = 'porcao')),
  foreign key (meal_id, user_id) references public.daily_meals (id, user_id) on delete cascade,
  foreign key (food_id, user_id) references public.foods (id, user_id) on delete restrict,
  foreign key (recipe_id, user_id) references public.recipes (id, user_id) on delete restrict
);

comment on table public.daily_meal_items is 'Itens (alimentos ou receitas) de cada refeição.';

create index daily_meal_items_meal_idx on public.daily_meal_items (meal_id, user_id);
create index daily_meal_items_food_idx on public.daily_meal_items (food_id, user_id) where food_id is not null;
create index daily_meal_items_recipe_idx on public.daily_meal_items (recipe_id, user_id) where recipe_id is not null;

create trigger daily_meal_items_set_updated_at
  before update on public.daily_meal_items
  for each row execute function public.set_updated_at();

create trigger daily_meal_items_check_unit
  before insert or update of food_id, unit on public.daily_meal_items
  for each row execute function public.check_item_food_unit();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.daily_meals enable row level security;
alter table public.daily_meal_items enable row level security;

create policy "daily_meals: ler as próprias" on public.daily_meals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "daily_meals: inserir as próprias" on public.daily_meals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "daily_meals: atualizar as próprias" on public.daily_meals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_meals: excluir as próprias" on public.daily_meals for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_meal_items: ler os próprios" on public.daily_meal_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "daily_meal_items: inserir os próprios" on public.daily_meal_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "daily_meal_items: atualizar os próprios" on public.daily_meal_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_meal_items: excluir os próprios" on public.daily_meal_items for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.daily_meals, public.daily_meal_items from anon;
grant select, insert, update, delete on public.daily_meals, public.daily_meal_items to authenticated;
