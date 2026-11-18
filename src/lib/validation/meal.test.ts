import { describe, expect, it } from "vitest";

import { mealSchema } from "./meal";

const food = "4b1e7a2a-5d0b-4f7e-9f5e-2b8a1c3d4e5f";
const base = { id: null, date: "2026-11-18", meal_type: "almoco", custom_name: "", items: [{ id: null, food_id: food, recipe_id: null, quantity: "150", unit: "g" }] };

describe("mealSchema", () => {
  it("aceita refeição válida e converte quantidade", () => {
    const meal = mealSchema.parse(base);
    expect(meal.items[0].quantity).toBe(150);
    expect(meal.custom_name).toBeNull();
  });

  it("personalizada exige nome; outros tipos descartam o nome", () => {
    expect(mealSchema.safeParse({ ...base, meal_type: "personalizada" }).success).toBe(false);
    expect(mealSchema.parse({ ...base, meal_type: "personalizada", custom_name: "Pré-treino" }).custom_name).toBe("Pré-treino");
    expect(mealSchema.parse({ ...base, custom_name: "ignorado" }).custom_name).toBeNull();
  });

  it("exige itens com exatamente uma origem e unidade coerente", () => {
    expect(mealSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, items: [{ ...base.items[0], recipe_id: food }] }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, items: [{ ...base.items[0], unit: "porcao" }] }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, items: [{ ...base.items[0], food_id: null, recipe_id: food, unit: "porcao", quantity: "0,5" }] }).success).toBe(true);
    expect(mealSchema.safeParse({ ...base, items: [{ ...base.items[0], quantity: "0" }] }).success).toBe(false);
  });
});
