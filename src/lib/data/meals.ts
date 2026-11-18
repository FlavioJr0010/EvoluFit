import "server-only";

import type { DateRange } from "@/lib/dates";
import { recipePerServing } from "@/lib/nutrition/calc";
import { MEAL_TYPE_ORDER, totalsFromSnapshots, type MealType, type RecipeSource } from "@/lib/nutrition/meals";
import { NUTRIENT_KEYS, type FoodNutritionSource, type FoodUnit, type Nutrition, type QuantityUnit } from "@/lib/nutrition/types";

import { authed } from "./context";
import { FOOD_COLUMNS } from "./foods";

export type MealItem = {
  id: string;
  food_id: string | null;
  recipe_id: string | null;
  quantity: number;
  unit: QuantityUnit;
  position: number;
  name: string;
  nutrition: Nutrition;
};

export type Meal = {
  id: string;
  date: string;
  meal_type: MealType;
  custom_name: string | null;
  created_at: string;
  items: MealItem[];
  totals: Nutrition;
};

const ITEM_COLUMNS = `id, food_id, recipe_id, quantity, unit, position, name_snapshot, calories, ${NUTRIENT_KEYS.join(", ")}, incomplete_nutrients`;
const MEAL_SELECT = `id, date, meal_type, custom_name, created_at, daily_meal_items ( ${ITEM_COLUMNS} )`;

type ItemRow = {
  id: string;
  food_id: string | null;
  recipe_id: string | null;
  quantity: number;
  unit: QuantityUnit;
  position: number;
  name_snapshot: string;
  calories: number;
  incomplete_nutrients: string[];
} & Record<string, unknown>;

type MealRow = {
  id: string;
  date: string;
  meal_type: MealType;
  custom_name: string | null;
  created_at: string;
  daily_meal_items: ItemRow[];
};

function toMeal(row: MealRow): Meal {
  const items = [...row.daily_meal_items]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      id: i.id,
      food_id: i.food_id,
      recipe_id: i.recipe_id,
      quantity: Number(i.quantity),
      unit: i.unit,
      position: i.position,
      name: i.name_snapshot,
      nutrition: totalsFromSnapshots([i]),
    }));
  return {
    id: row.id,
    date: row.date,
    meal_type: row.meal_type,
    custom_name: row.custom_name,
    created_at: row.created_at,
    items,
    totals: totalsFromSnapshots(row.daily_meal_items),
  };
}

const byMealOrder = (a: Meal, b: Meal) =>
  a.date.localeCompare(b.date) ||
  MEAL_TYPE_ORDER[a.meal_type] - MEAL_TYPE_ORDER[b.meal_type] ||
  a.created_at.localeCompare(b.created_at);

export async function listMealsByDate(date: string): Promise<Meal[]> {
  return listMealsInRange({ from: date, to: date });
}

export async function listMealsInRange(range: DateRange): Promise<Meal[]> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("daily_meals")
    .select(MEAL_SELECT)
    .gte("date", range.from)
    .lte("date", range.to)
    .limit(2000);
  return ((data ?? []) as unknown as MealRow[]).map(toMeal).sort(byMealOrder);
}

export async function getMeal(id: string): Promise<Meal | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("daily_meals").select(MEAL_SELECT).eq("id", id).maybeSingle();
  return data ? toMeal(data as unknown as MealRow) : null;
}

/** Alimentos e receitas referenciados (inclusive arquivados) para recalcular snapshots. */
export async function loadSources(foodIds: string[], recipeIds: string[]) {
  const { supabase } = await authed();
  const [foodsRes, recipesRes] = await Promise.all([
    foodIds.length
      ? supabase.from("foods").select(FOOD_COLUMNS).in("id", foodIds)
      : Promise.resolve({ data: [] as unknown[] }),
    recipeIds.length
      ? supabase
          .from("recipes")
          .select(`id, name, servings, archived_at, recipe_items ( quantity, unit, foods ( ${FOOD_COLUMNS} ) )`)
          .in("id", recipeIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  type FoodRow = FoodNutritionSource & { id: string; archived_at: string | null };
  type RecipeRow = {
    id: string;
    name: string;
    servings: number;
    archived_at: string | null;
    recipe_items: { quantity: number; unit: FoodUnit; foods: FoodNutritionSource }[];
  };

  const foods = new Map<string, FoodNutritionSource>();
  const archived = new Set<string>();
  for (const f of (foodsRes.data ?? []) as FoodRow[]) {
    foods.set(f.id, f);
    if (f.archived_at) archived.add(f.id);
  }
  const recipes = new Map<string, RecipeSource>();
  for (const r of (recipesRes.data ?? []) as RecipeRow[]) {
    recipes.set(r.id, {
      name: r.name,
      perServing: recipePerServing(
        r.recipe_items.map((i) => ({ food: i.foods, quantity: Number(i.quantity), unit: i.unit })),
        Number(r.servings),
      ),
    });
    if (r.archived_at) archived.add(r.id);
  }
  return { foods, recipes, archived };
}
