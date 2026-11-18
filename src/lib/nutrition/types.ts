import type { Database } from "@/lib/supabase/database.types";

export type QuantityUnit = Database["public"]["Enums"]["quantity_unit"];
export type FoodUnit = Exclude<QuantityUnit, "porcao">;

export const NUTRIENT_KEYS = [
  "carbs_g",
  "protein_g",
  "fiber_g",
  "fat_g",
  "saturated_fat_g",
  "sodium_mg",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

export const NUTRIENTS: Record<NutrientKey, { label: string; short: string; unit: "g" | "mg" }> = {
  carbs_g: { label: "Carboidratos", short: "Carb.", unit: "g" },
  protein_g: { label: "Proteínas", short: "Prot.", unit: "g" },
  fiber_g: { label: "Fibras", short: "Fibras", unit: "g" },
  fat_g: { label: "Gorduras totais", short: "Gord.", unit: "g" },
  saturated_fat_g: { label: "Gorduras saturadas", short: "Saturadas", unit: "g" },
  sodium_mg: { label: "Sódio", short: "Sódio", unit: "mg" },
};

export const UNIT_LABELS: Record<QuantityUnit, string> = {
  g: "g",
  ml: "ml",
  unidade: "unidade",
  porcao: "porção",
};

/**
 * Valores nutricionais de um item ou de um total.
 * - `nutrients[k]`: soma dos valores conhecidos; null se nenhum componente tinha o nutriente.
 * - `incomplete`: nutrientes em que algum componente não tinha dado (total parcial).
 */
export type Nutrition = {
  calories: number;
  nutrients: Record<NutrientKey, number | null>;
  incomplete: NutrientKey[];
};

/** Dados do alimento necessários para o cálculo. */
export type FoodNutritionSource = {
  name: string;
  base_unit: FoodUnit;
  base_quantity: number;
  unit_weight: number | null;
  unit_weight_unit: QuantityUnit | null;
  calories: number;
} & Record<NutrientKey, number | null>;

/** Formato gravado em daily_meal_items (snapshot). */
export type NutritionSnapshot = {
  name: string;
  calories: number;
  incomplete_nutrients: NutrientKey[];
} & Record<NutrientKey, number | null>;
