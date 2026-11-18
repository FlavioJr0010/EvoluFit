-- =====================================================================
-- EvoluFit — alimentos e preparações (receitas)
-- =====================================================================

-- ---------------------------------------------------------------------
-- foods: nutrientes registrados para a quantidade-base
-- ---------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  base_unit public.quantity_unit not null check (base_unit <> 'porcao'),
  base_quantity numeric(10, 3) not null check (base_quantity > 0),
  -- peso_por_unidade (opcional): converte entre 'unidade' e g/ml.
  -- base g/ml  -> quantos g/ml tem 1 unidade (unit_weight_unit = base_unit)
  -- base unidade -> quantos g ou ml tem 1 unidade (unit_weight_unit = g|ml)
  unit_weight numeric(10, 3) check (unit_weight > 0),
  unit_weight_unit public.quantity_unit check (unit_weight_unit in ('g', 'ml')),
  calories numeric(10, 2) not null check (calories >= 0),
  -- NULL = não cadastrado (diferente de zero)
  carbs_g numeric(10, 2) check (carbs_g >= 0),
  protein_g numeric(10, 2) check (protein_g >= 0),
  fiber_g numeric(10, 2) check (fiber_g >= 0),
  fat_g numeric(10, 2) check (fat_g >= 0),
  saturated_fat_g numeric(10, 2) check (saturated_fat_g >= 0),
  sodium_mg numeric(10, 2) check (sodium_mg >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint foods_unit_weight_pair check ((unit_weight is null) = (unit_weight_unit is null)),
  constraint foods_unit_weight_unit_matches_base check (
    unit_weight_unit is null or base_unit = 'unidade' or unit_weight_unit = base_unit
  ),
  constraint foods_saturated_le_total check (
    saturated_fat_g is null or fat_g is null or saturated_fat_g <= fat_g
  )
);

comment on table public.foods is 'Alimentos e nutrientes por quantidade-base.';

create index foods_user_name_idx on public.foods (user_id, lower(name));

create trigger foods_set_updated_at
  before update on public.foods
  for each row execute function public.set_updated_at();

-- Unidade válida para lançar um alimento (mesma regra de src/lib/nutrition).
create function public.food_accepts_unit(
  p_base_unit public.quantity_unit,
  p_unit_weight_unit public.quantity_unit,
  p_unit public.quantity_unit
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_unit = p_base_unit
    or (p_unit_weight_unit is not null and p_base_unit in ('g', 'ml') and p_unit = 'unidade')
    or (p_unit_weight_unit is not null and p_base_unit = 'unidade' and p_unit = p_unit_weight_unit);
$$;

-- ---------------------------------------------------------------------
-- recipes: preparações compostas apenas por alimentos
-- ---------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  servings numeric(8, 2) not null default 1 check (servings > 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.recipes is 'Preparações compostas, como ovo mexido.';
comment on column public.recipes.servings is 'Rendimento em porções (padrão 1).';

create index recipes_user_name_idx on public.recipes (user_id, lower(name));

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- recipe_items: ingredientes de uma preparação
-- ---------------------------------------------------------------------
create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id uuid not null,
  food_id uuid not null,
  quantity numeric(10, 3) not null check (quantity > 0),
  unit public.quantity_unit not null check (unit <> 'porcao'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  -- chaves compostas: receita e alimento precisam ser do mesmo usuário
  foreign key (recipe_id, user_id) references public.recipes (id, user_id) on delete cascade,
  foreign key (food_id, user_id) references public.foods (id, user_id) on delete restrict
);

comment on table public.recipe_items is 'Ingredientes e quantidades de uma preparação.';

create index recipe_items_recipe_idx on public.recipe_items (recipe_id, user_id);
create index recipe_items_food_idx on public.recipe_items (food_id, user_id);

-- Garante que a unidade do ingrediente é compatível com o alimento.
create function public.check_item_food_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_food public.foods;
begin
  if new.food_id is null then
    return new;
  end if;

  select * into v_food from public.foods where id = new.food_id and user_id = new.user_id;
  if not found then
    -- a FK composta reporta o erro adequado
    return new;
  end if;

  if not public.food_accepts_unit(v_food.base_unit, v_food.unit_weight_unit, new.unit) then
    raise exception 'Unidade "%" incompatível com o alimento "%".', new.unit, v_food.name
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger recipe_items_check_unit
  before insert or update of food_id, unit on public.recipe_items
  for each row execute function public.check_item_food_unit();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;

create policy "foods: ler os próprios" on public.foods for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "foods: inserir os próprios" on public.foods for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "foods: atualizar os próprios" on public.foods for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "foods: excluir os próprios" on public.foods for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "recipes: ler as próprias" on public.recipes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "recipes: inserir as próprias" on public.recipes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "recipes: atualizar as próprias" on public.recipes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recipes: excluir as próprias" on public.recipes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "recipe_items: ler os próprios" on public.recipe_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "recipe_items: inserir os próprios" on public.recipe_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "recipe_items: atualizar os próprios" on public.recipe_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recipe_items: excluir os próprios" on public.recipe_items for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.foods, public.recipes, public.recipe_items from anon;
grant select, insert, update, delete on public.foods, public.recipes, public.recipe_items to authenticated;
