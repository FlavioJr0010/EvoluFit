import { z } from "zod";

import { dateSchema, uuidSchema } from "./common";
import { decimalPtBR } from "./decimal";

export const MEAL_TYPE_VALUES = ["cafe_da_manha", "almoco", "lanche", "jantar", "personalizada"] as const;

export const mealItemSchema = z
  .object({
    id: uuidSchema.nullable(),
    food_id: uuidSchema.nullable(),
    recipe_id: uuidSchema.nullable(),
    quantity: decimalPtBR("Quantidade inválida.").pipe(
      z.number().gt(0, "A quantidade deve ser maior que zero.").max(100000, "Quantidade muito alta."),
    ),
    unit: z.enum(["g", "ml", "unidade", "porcao"]),
  })
  .refine((i) => (i.food_id == null) !== (i.recipe_id == null), "Escolha um alimento ou uma preparação.")
  .refine((i) => (i.recipe_id != null) === (i.unit === "porcao"), "Preparações são lançadas em porções.");

export const mealSchema = z
  .object({
    id: uuidSchema.nullable(),
    date: dateSchema,
    meal_type: z.enum(MEAL_TYPE_VALUES, { error: "Escolha o tipo de refeição." }),
    custom_name: z
      .string()
      .trim()
      .max(60, "Use até 60 caracteres.")
      .transform((v) => (v === "" ? null : v)),
    items: z.array(mealItemSchema).min(1, "Adicione pelo menos um item.").max(60, "Máximo de 60 itens."),
  })
  .transform((m) => ({ ...m, custom_name: m.meal_type === "personalizada" ? m.custom_name : null }))
  .superRefine((m, ctx) => {
    if (m.meal_type === "personalizada" && !m.custom_name) {
      ctx.addIssue({ code: "custom", path: ["custom_name"], message: "Informe o nome da refeição personalizada." });
    }
  });

export type MealInput = z.infer<typeof mealSchema>;

export const duplicateMealsSchema = z.object({
  source_date: dateSchema,
  target_date: dateSchema,
  meal_ids: z.array(uuidSchema).min(1, "Escolha pelo menos uma refeição.").max(20),
});
