import "server-only";

import { recipePerServing } from "@/lib/nutrition/calc";
import type { FoodNutritionSource, FoodUnit, Nutrition } from "@/lib/nutrition/types";

import { authed } from "./context";

export const FOOD_COLUMNS =
  "id, name, base_unit, base_quantity, unit_weight, unit_weight_unit, calories, carbs_g, protein_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, notes, archived_at";

export type Food = FoodNutritionSource & {
  id: string;
  notes: string | null;
  archived_at: string | null;
};

/** PostgREST devolve numeric como número; normaliza tipos e unidades. */
function toFood(row: Record<string, unknown>): Food {
  return row as unknown as Food;
}

export async function listFoods({ search, archived = false }: { search?: string; archived?: boolean } = {}) {
  const { supabase } = await authed();
  let query = supabase.from("foods").select(FOOD_COLUMNS).order("name");
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (search) query = query.ilike("name", `%${search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data } = await query.limit(500);
  return (data ?? []).map(toFood);
}

export async function getFood(id: string): Promise<Food | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("foods").select(FOOD_COLUMNS).eq("id", id).maybeSingle();
  return data ? toFood(data) : null;
}

/** Em quantas receitas e itens de refeição o alimento é usado. */
export async function getFoodUsage(id: string) {
  const { supabase } = await authed();
  const [recipes, meals] = await Promise.all([
    supabase.from("recipe_items").select("id", { count: "exact", head: true }).eq("food_id", id),
    supabase.from("daily_meal_items").select("id", { count: "exact", head: true }).eq("food_id", id),
  ]);
  return { recipes: recipes.count ?? 0, meals: meals.count ?? 0 };
}

// ---------------------------------------------------------------------
// Receitas
// ---------------------------------------------------------------------
export type RecipeIngredientRow = {
  id: string;
  quantity: number;
  unit: FoodUnit;
  position: number;
  food: Food;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  notes: string | null;
  archived_at: string | null;
  items: RecipeIngredientRow[];
  /** Valores de UMA porção, derivados dos ingredientes. */
  perServing: Nutrition;
};

const RECIPE_SELECT = `id, name, servings, notes, archived_at,
  recipe_items ( id, quantity, unit, position, foods ( ${FOOD_COLUMNS} ) )`;

type RecipeRow = {
  id: string;
  name: string;
  servings: number;
  notes: string | null;
  archived_at: string | null;
  recipe_items: { id: string; quantity: number; unit: string; position: number; foods: unknown }[];
};

function toRecipe(row: RecipeRow): Recipe {
  const items = [...row.recipe_items]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      id: i.id,
      quantity: Number(i.quantity),
      unit: i.unit as FoodUnit,
      position: i.position,
      food: toFood(i.foods as Record<string, unknown>),
    }));
  return {
    id: row.id,
    name: row.name,
    servings: Number(row.servings),
    notes: row.notes,
    archived_at: row.archived_at,
    items,
    perServing: recipePerServing(
      items.map((i) => ({ food: i.food, quantity: i.quantity, unit: i.unit })),
      Number(row.servings),
    ),
  };
}

export async function listRecipes({ archived = false }: { archived?: boolean } = {}): Promise<Recipe[]> {
  const { supabase } = await authed();
  let query = supabase.from("recipes").select(RECIPE_SELECT).order("name");
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data } = await query.limit(500);
  return ((data ?? []) as unknown as RecipeRow[]).map(toRecipe);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("recipes").select(RECIPE_SELECT).eq("id", id).maybeSingle();
  return data ? toRecipe(data as unknown as RecipeRow) : null;
}

export async function getRecipeUsage(id: string) {
  const { supabase } = await authed();
  const { count } = await supabase
    .from("daily_meal_items")
    .select("id", { count: "exact", head: true })
    .eq("recipe_id", id);
  return { meals: count ?? 0 };
}
