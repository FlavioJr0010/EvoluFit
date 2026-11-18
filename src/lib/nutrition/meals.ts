import type { Database } from "@/lib/supabase/database.types";

import { foodNutrition, fromSnapshot, scaleNutrition, sumNutrition, toSnapshot } from "./calc";
import type { FoodNutritionSource, Nutrition, NutritionSnapshot, QuantityUnit } from "./types";

export type MealType = Database["public"]["Enums"]["meal_type"];

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche", label: "Lanche" },
  { value: "jantar", label: "Jantar" },
  { value: "personalizada", label: "Personalizada" },
];

export const MEAL_TYPE_ORDER: Record<MealType, number> = {
  cafe_da_manha: 0,
  almoco: 1,
  lanche: 2,
  jantar: 3,
  personalizada: 4,
};

export function mealLabel(meal: { meal_type: MealType; custom_name: string | null }): string {
  return meal.meal_type === "personalizada" && meal.custom_name
    ? meal.custom_name
    : (MEAL_TYPES.find((t) => t.value === meal.meal_type)?.label ?? meal.meal_type);
}

/** Item de refeição como enviado pelo editor. */
export type MealItemInput = {
  id: string | null;
  food_id: string | null;
  recipe_id: string | null;
  quantity: number;
  unit: QuantityUnit;
};

/** Item já gravado (para detectar alterações). */
export type StoredMealItem = MealItemInput & { id: string };

/** Fonte de cálculo de uma receita: valores de uma porção. */
export type RecipeSource = { name: string; perServing: Nutrition };

export type MealItemPayload = MealItemInput & { snapshot: NutritionSnapshot | null };

export class MissingSourceError extends Error {}

const sameItem = (a: MealItemInput, b: MealItemInput) =>
  a.food_id === b.food_id && a.recipe_id === b.recipe_id && a.quantity === b.quantity && a.unit === b.unit;

/** Nutrição de um item a partir dos cadastros atuais. */
export function itemNutrition(
  item: Pick<MealItemInput, "food_id" | "recipe_id" | "quantity" | "unit">,
  foods: Map<string, FoodNutritionSource>,
  recipes: Map<string, RecipeSource>,
): { name: string; nutrition: Nutrition } {
  if (item.food_id) {
    const food = foods.get(item.food_id);
    if (!food) throw new MissingSourceError("Alimento não encontrado.");
    return { name: food.name, nutrition: foodNutrition(food, item.quantity, item.unit) };
  }
  const recipe = item.recipe_id ? recipes.get(item.recipe_id) : undefined;
  if (!recipe) throw new MissingSourceError("Preparação não encontrada.");
  if (item.unit !== "porcao") throw new MissingSourceError("Preparações são lançadas em porções.");
  return { name: recipe.name, nutrition: scaleNutrition(recipe.perServing, item.quantity) };
}

/**
 * Monta o payload de save_meal:
 * - item novo ou alterado (origem, quantidade ou unidade) -> snapshot recalculado
 * - item existente inalterado -> snapshot null (mantém o valor histórico)
 */
export function buildMealPayload(
  items: MealItemInput[],
  stored: StoredMealItem[],
  foods: Map<string, FoodNutritionSource>,
  recipes: Map<string, RecipeSource>,
): MealItemPayload[] {
  const storedById = new Map(stored.map((s) => [s.id, s]));
  return items.map((item) => {
    const previous = item.id ? storedById.get(item.id) : undefined;
    if (item.id && !previous) throw new MissingSourceError("Item da refeição não encontrado.");
    if (previous && sameItem(previous, item)) return { ...item, snapshot: null };
    const { name, nutrition } = itemNutrition(item, foods, recipes);
    return { ...item, snapshot: toSnapshot(name, nutrition) };
  });
}

/** Totais de uma refeição/dia a partir dos snapshots gravados. */
export function totalsFromSnapshots(
  rows: ({ calories: number; incomplete_nutrients: string[] } & Record<string, unknown>)[],
): Nutrition {
  return sumNutrition(rows.map((r) => fromSnapshot(r as Parameters<typeof fromSnapshot>[0])));
}
