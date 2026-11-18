-- =====================================================================
-- EvoluFit — gravação atômica de registros compostos
--
-- Todas as funções são SECURITY INVOKER: executam com as permissões e o
-- RLS do usuário que chama. Snapshots nutricionais são calculados no
-- servidor da aplicação (src/lib/nutrition) e recebidos prontos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- save_recipe: cria/atualiza a receita e substitui os ingredientes
-- p_items: [{ "food_id": uuid, "quantity": number, "unit": "g"|"ml"|"unidade" }]
-- ---------------------------------------------------------------------
create function public.save_recipe(
  p_id uuid,
  p_name text,
  p_servings numeric,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A preparação precisa de pelo menos um ingrediente.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.recipes (name, servings, notes)
    values (p_name, p_servings, p_notes)
    returning id into v_id;
  else
    update public.recipes
       set name = p_name, servings = p_servings, notes = p_notes
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Preparação não encontrada.' using errcode = 'P0002';
    end if;

    delete from public.recipe_items where recipe_id = v_id;
  end if;

  insert into public.recipe_items (recipe_id, food_id, quantity, unit, position)
  select v_id,
         (item ->> 'food_id')::uuid,
         (item ->> 'quantity')::numeric,
         (item ->> 'unit')::public.quantity_unit,
         (ord - 1)::integer
    from jsonb_array_elements(p_items) with ordinality as t (item, ord);

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- save_meal: cria/atualiza a refeição e sincroniza os itens
-- p_items: [{
--   "id": uuid|null,              -- item existente (null = novo)
--   "food_id": uuid|null, "recipe_id": uuid|null,
--   "quantity": number, "unit": "g"|"ml"|"unidade"|"porcao",
--   "snapshot": {...}|null        -- null = item inalterado, mantém o snapshot
-- }]
-- Itens existentes ausentes da lista são removidos.
-- ---------------------------------------------------------------------
create function public.save_meal(
  p_id uuid,
  p_date date,
  p_meal_type public.meal_type,
  p_custom_name text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_item jsonb;
  v_snapshot jsonb;
  v_ord bigint;
  v_item_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A refeição precisa de pelo menos um item.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.daily_meals (date, meal_type, custom_name)
    values (p_date, p_meal_type, p_custom_name)
    returning id into v_id;
  else
    update public.daily_meals
       set date = p_date, meal_type = p_meal_type, custom_name = p_custom_name
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Refeição não encontrada.' using errcode = 'P0002';
    end if;

    delete from public.daily_meal_items
     where meal_id = v_id
       and id not in (
         select (item ->> 'id')::uuid
           from jsonb_array_elements(p_items) as t (item)
          where item ->> 'id' is not null
       );
  end if;

  for v_item, v_ord in
    select item, ord from jsonb_array_elements(p_items) with ordinality as t (item, ord)
  loop
    v_item_id := (v_item ->> 'id')::uuid;
    v_snapshot := v_item -> 'snapshot';
    if v_snapshot = 'null'::jsonb then
      v_snapshot := null;
    end if;

    if v_item_id is not null and v_snapshot is null then
      -- inalterado: só a posição pode mudar
      update public.daily_meal_items
         set position = (v_ord - 1)::integer
       where id = v_item_id and meal_id = v_id;
    elsif v_snapshot is null then
      raise exception 'Item novo sem valores nutricionais calculados.' using errcode = '22023';
    elsif v_item_id is not null then
      update public.daily_meal_items
         set food_id = (v_item ->> 'food_id')::uuid,
             recipe_id = (v_item ->> 'recipe_id')::uuid,
             quantity = (v_item ->> 'quantity')::numeric,
             unit = (v_item ->> 'unit')::public.quantity_unit,
             position = (v_ord - 1)::integer,
             name_snapshot = v_snapshot ->> 'name',
             calories = (v_snapshot ->> 'calories')::numeric,
             carbs_g = (v_snapshot ->> 'carbs_g')::numeric,
             protein_g = (v_snapshot ->> 'protein_g')::numeric,
             fiber_g = (v_snapshot ->> 'fiber_g')::numeric,
             fat_g = (v_snapshot ->> 'fat_g')::numeric,
             saturated_fat_g = (v_snapshot ->> 'saturated_fat_g')::numeric,
             sodium_mg = (v_snapshot ->> 'sodium_mg')::numeric,
             incomplete_nutrients = array(
               select jsonb_array_elements_text(coalesce(v_snapshot -> 'incomplete_nutrients', '[]'::jsonb))
             )
       where id = v_item_id and meal_id = v_id;
    else
      insert into public.daily_meal_items (
        meal_id, food_id, recipe_id, quantity, unit, position,
        name_snapshot, calories, carbs_g, protein_g, fiber_g, fat_g, saturated_fat_g, sodium_mg,
        incomplete_nutrients
      ) values (
        v_id,
        (v_item ->> 'food_id')::uuid,
        (v_item ->> 'recipe_id')::uuid,
        (v_item ->> 'quantity')::numeric,
        (v_item ->> 'unit')::public.quantity_unit,
        (v_ord - 1)::integer,
        v_snapshot ->> 'name',
        (v_snapshot ->> 'calories')::numeric,
        (v_snapshot ->> 'carbs_g')::numeric,
        (v_snapshot ->> 'protein_g')::numeric,
        (v_snapshot ->> 'fiber_g')::numeric,
        (v_snapshot ->> 'fat_g')::numeric,
        (v_snapshot ->> 'saturated_fat_g')::numeric,
        (v_snapshot ->> 'sodium_mg')::numeric,
        array(select jsonb_array_elements_text(coalesce(v_snapshot -> 'incomplete_nutrients', '[]'::jsonb)))
      );
    end if;

    if v_item_id is not null and not found then
      raise exception 'Item da refeição não encontrado.' using errcode = 'P0002';
    end if;
  end loop;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- save_workout: cria/atualiza o treino e substitui exercícios e séries
-- p_exercises: [{
--   "exercise_id": uuid, "notes": text|null,
--   "sets": [{ "load_kg": number|null, "reps": int, "is_warmup": bool, "notes": text|null }]
-- }]
-- ---------------------------------------------------------------------
create function public.save_workout(
  p_id uuid,
  p_date date,
  p_title text,
  p_notes text,
  p_exercises jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_exercise jsonb;
  v_ord bigint;
  v_workout_exercise_id uuid;
begin
  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' or jsonb_array_length(p_exercises) = 0 then
    raise exception 'O treino precisa de pelo menos um exercício.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.workouts (date, title, notes)
    values (p_date, p_title, p_notes)
    returning id into v_id;
  else
    update public.workouts
       set date = p_date, title = p_title, notes = p_notes
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Treino não encontrado.' using errcode = 'P0002';
    end if;

    delete from public.workout_exercises where workout_id = v_id;
  end if;

  for v_exercise, v_ord in
    select item, ord from jsonb_array_elements(p_exercises) with ordinality as t (item, ord)
  loop
    if jsonb_typeof(v_exercise -> 'sets') is distinct from 'array'
       or jsonb_array_length(v_exercise -> 'sets') = 0 then
      raise exception 'Cada exercício precisa de pelo menos uma série.' using errcode = '22023';
    end if;

    insert into public.workout_exercises (workout_id, exercise_id, position, notes)
    values (v_id, (v_exercise ->> 'exercise_id')::uuid, (v_ord - 1)::integer, v_exercise ->> 'notes')
    returning id into v_workout_exercise_id;

    insert into public.exercise_sets (workout_exercise_id, set_number, load_kg, reps, is_warmup, notes)
    select v_workout_exercise_id,
           s_ord::integer,
           (s ->> 'load_kg')::numeric,
           (s ->> 'reps')::integer,
           coalesce((s ->> 'is_warmup')::boolean, false),
           s ->> 'notes'
      from jsonb_array_elements(v_exercise -> 'sets') with ordinality as st (s, s_ord);
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.save_recipe(uuid, text, numeric, text, jsonb) from public, anon;
revoke execute on function public.save_meal(uuid, date, public.meal_type, text, jsonb) from public, anon;
revoke execute on function public.save_workout(uuid, date, text, text, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, text, numeric, text, jsonb) to authenticated;
grant execute on function public.save_meal(uuid, date, public.meal_type, text, jsonb) to authenticated;
grant execute on function public.save_workout(uuid, date, text, text, jsonb) to authenticated;

-- funções utilitárias não precisam ser chamadas pela API
revoke execute on function public.is_valid_timezone(text) from anon;
revoke execute on function public.food_accepts_unit(public.quantity_unit, public.quantity_unit, public.quantity_unit) from anon;
