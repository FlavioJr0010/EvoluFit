import {
  NUTRIENT_KEYS,
  type FoodNutritionSource,
  type FoodUnit,
  type NutrientKey,
  type Nutrition,
  type NutritionSnapshot,
  type QuantityUnit,
} from "./types";

export class UnitConversionError extends Error {}

/**
 * Unidades em que o alimento pode ser lançado.
 * Mesma regra da função SQL public.food_accepts_unit.
 */
export function allowedUnits(food: Pick<FoodNutritionSource, "base_unit" | "unit_weight" | "unit_weight_unit">): FoodUnit[] {
  const units: FoodUnit[] = [food.base_unit];
  if (food.unit_weight != null && food.unit_weight_unit) {
    if (food.base_unit === "unidade") units.push(food.unit_weight_unit as FoodUnit);
    else units.push("unidade");
  }
  return units;
}

/** Converte a quantidade lançada para a unidade-base do alimento. */
export function toBaseQuantity(
  food: Pick<FoodNutritionSource, "base_unit" | "unit_weight" | "unit_weight_unit">,
  quantity: number,
  unit: QuantityUnit,
): number {
  if (unit === food.base_unit) return quantity;
  if (!allowedUnits(food).includes(unit as FoodUnit) || food.unit_weight == null) {
    throw new UnitConversionError(`Unidade "${unit}" incompatível com este alimento.`);
  }
  // base g/ml, lançado em unidades: unidades × peso por unidade
  if (unit === "unidade") return quantity * food.unit_weight;
  // base unidade, lançado em g/ml: g ÷ peso por unidade
  return quantity / food.unit_weight;
}

export function emptyNutrition(): Nutrition {
  return {
    calories: 0,
    nutrients: Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null])) as Nutrition["nutrients"],
    incomplete: [],
  };
}

/** Nutrientes do alimento proporcionais à quantidade consumida. */
export function foodNutrition(food: FoodNutritionSource, quantity: number, unit: QuantityUnit): Nutrition {
  const factor = toBaseQuantity(food, quantity, unit) / food.base_quantity;
  const result = emptyNutrition();
  result.calories = food.calories * factor;
  for (const key of NUTRIENT_KEYS) {
    const value = food[key];
    if (value == null) result.incomplete.push(key);
    else result.nutrients[key] = value * factor;
  }
  return result;
}

/** Soma itens: calorias sempre; nutrientes somam o que é conhecido e marcam parcialidade. */
export function sumNutrition(items: Nutrition[]): Nutrition {
  const result = emptyNutrition();
  const incomplete = new Set<NutrientKey>();
  for (const item of items) {
    result.calories += item.calories;
    for (const key of NUTRIENT_KEYS) {
      const value = item.nutrients[key];
      if (value != null) result.nutrients[key] = (result.nutrients[key] ?? 0) + value;
      if (item.incomplete.includes(key) || value == null) incomplete.add(key);
    }
  }
  result.incomplete = NUTRIENT_KEYS.filter((k) => incomplete.has(k));
  return result;
}

export function scaleNutrition(nutrition: Nutrition, factor: number): Nutrition {
  return {
    calories: nutrition.calories * factor,
    nutrients: Object.fromEntries(
      NUTRIENT_KEYS.map((k) => [k, nutrition.nutrients[k] == null ? null : nutrition.nutrients[k]! * factor]),
    ) as Nutrition["nutrients"],
    incomplete: [...nutrition.incomplete],
  };
}

export type RecipeIngredient = { food: FoodNutritionSource; quantity: number; unit: QuantityUnit };

/** Valores de uma porção da receita, sempre derivados dos ingredientes. */
export function recipePerServing(ingredients: RecipeIngredient[], servings: number): Nutrition {
  if (servings <= 0) throw new RangeError("Rendimento deve ser maior que zero.");
  const total = sumNutrition(ingredients.map((i) => foodNutrition(i.food, i.quantity, i.unit)));
  return scaleNutrition(total, 1 / servings);
}

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export function roundNutrition(nutrition: Nutrition, digits = 2): Nutrition {
  return {
    calories: round(nutrition.calories, digits),
    nutrients: Object.fromEntries(
      NUTRIENT_KEYS.map((k) => [k, nutrition.nutrients[k] == null ? null : round(nutrition.nutrients[k]!, digits)]),
    ) as Nutrition["nutrients"],
    incomplete: [...nutrition.incomplete],
  };
}

export function toSnapshot(name: string, nutrition: Nutrition): NutritionSnapshot {
  const rounded = roundNutrition(nutrition);
  return {
    name,
    calories: rounded.calories,
    ...rounded.nutrients,
    incomplete_nutrients: rounded.incomplete,
  };
}

/** Reconstrói Nutrition a partir de uma linha de daily_meal_items. */
export function fromSnapshot(
  row: { calories: number; incomplete_nutrients: string[] } & Record<NutrientKey, number | null>,
): Nutrition {
  return {
    calories: Number(row.calories),
    nutrients: Object.fromEntries(
      NUTRIENT_KEYS.map((k) => [k, row[k] == null ? null : Number(row[k])]),
    ) as Nutrition["nutrients"],
    incomplete: NUTRIENT_KEYS.filter((k) => row.incomplete_nutrients.includes(k)),
  };
}
