import { z } from "zod";

import { NUTRIENT_KEYS } from "@/lib/nutrition/types";

import { optionalText, requiredText, uuidSchema } from "./common";
import { decimalPtBR, optionalDecimalPtBR } from "./decimal";

export const FOOD_UNITS = ["g", "ml", "unidade"] as const;

const nonNegative = optionalDecimalPtBR().pipe(z.number().min(0, "Não pode ser negativo.").max(100000).nullable());

export const foodSchema = z
  .object({
    name: requiredText(120, "Informe o nome do alimento."),
    base_unit: z.enum(FOOD_UNITS, { error: "Escolha a unidade da base." }),
    base_quantity: decimalPtBR("Informe a quantidade da base.").pipe(
      z.number().gt(0, "A quantidade da base deve ser maior que zero.").max(100000),
    ),
    unit_weight: optionalDecimalPtBR().pipe(z.number().gt(0, "Deve ser maior que zero.").max(100000).nullable()),
    unit_weight_unit: z
      .enum(["g", "ml", ""])
      .optional()
      .transform((v) => (v ? v : null)),
    calories: decimalPtBR("Informe as calorias.").pipe(z.number().min(0, "Não pode ser negativo.").max(100000)),
    carbs_g: nonNegative,
    protein_g: nonNegative,
    fiber_g: nonNegative,
    fat_g: nonNegative,
    saturated_fat_g: nonNegative,
    sodium_mg: nonNegative,
    notes: optionalText(1000),
  })
  .transform((data) => {
    // Peso por unidade: com base g/ml a unidade é a própria base.
    if (data.unit_weight == null) return { ...data, unit_weight_unit: null };
    if (data.base_unit !== "unidade") return { ...data, unit_weight_unit: data.base_unit as "g" | "ml" };
    return data;
  })
  .superRefine((data, ctx) => {
    if (data.unit_weight != null && data.unit_weight_unit == null) {
      ctx.addIssue({ code: "custom", path: ["unit_weight_unit"], message: "Escolha se o peso da unidade é em g ou ml." });
    }
    if (data.saturated_fat_g != null && data.fat_g != null && data.saturated_fat_g > data.fat_g) {
      ctx.addIssue({ code: "custom", path: ["saturated_fat_g"], message: "Não pode ser maior que as gorduras totais." });
    }
  });

export type FoodInput = z.infer<typeof foodSchema>;

export const FOOD_FORM_FIELDS = [
  "name",
  "base_unit",
  "base_quantity",
  "unit_weight",
  "unit_weight_unit",
  "calories",
  ...NUTRIENT_KEYS,
  "notes",
] as const;

// ---------------------------------------------------------------------
// Receitas
// ---------------------------------------------------------------------
export const recipeSchema = z.object({
  id: uuidSchema.nullable(),
  name: requiredText(120, "Informe o nome da preparação."),
  servings: decimalPtBR("Informe o rendimento.").pipe(z.number().gt(0, "O rendimento deve ser maior que zero.").max(1000)),
  notes: optionalText(1000),
  items: z
    .array(
      z.object({
        food_id: uuidSchema,
        quantity: decimalPtBR("Quantidade inválida.").pipe(z.number().gt(0, "A quantidade deve ser maior que zero.").max(100000)),
        unit: z.enum(FOOD_UNITS),
      }),
    )
    .min(1, "Adicione pelo menos um ingrediente.")
    .max(50, "Máximo de 50 ingredientes."),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
