import { describe, expect, it } from "vitest";

import { foodNutrition, recipePerServing } from "./calc";
import { buildMealPayload, itemNutrition, mealLabel, MissingSourceError, totalsFromSnapshots, type RecipeSource } from "./meals";
import type { FoodNutritionSource } from "./types";

const pao: FoodNutritionSource = {
  name: "Pão francês",
  base_unit: "g",
  base_quantity: 50,
  unit_weight: 50,
  unit_weight_unit: "g",
  calories: 150,
  carbs_g: 29,
  protein_g: 4,
  fiber_g: null,
  fat_g: 1.5,
  saturated_fat_g: null,
  sodium_mg: null,
};
const ovo: FoodNutritionSource = { ...pao, name: "Ovo", base_unit: "unidade", base_quantity: 1, calories: 70, carbs_g: 0.4, protein_g: 6.3, fat_g: 4.8 };

const foods = new Map([
  ["pao", pao],
  ["ovo", ovo],
]);
const recipes = new Map<string, RecipeSource>([
  ["mexido", { name: "Ovo mexido", perServing: recipePerServing([{ food: ovo, quantity: 2, unit: "unidade" }], 1) }],
]);

describe("itemNutrition", () => {
  it("alimento proporcional e receita por porções (inclusive frações)", () => {
    expect(itemNutrition({ food_id: "pao", recipe_id: null, quantity: 2, unit: "unidade" }, foods, recipes).nutrition.calories).toBe(300);
    expect(itemNutrition({ food_id: null, recipe_id: "mexido", quantity: 0.5, unit: "porcao" }, foods, recipes)).toMatchObject({
      name: "Ovo mexido",
      nutrition: { calories: 70 },
    });
  });

  it("falha com origem inexistente ou unidade errada para receita", () => {
    expect(() => itemNutrition({ food_id: "x", recipe_id: null, quantity: 1, unit: "g" }, foods, recipes)).toThrow(MissingSourceError);
    expect(() => itemNutrition({ food_id: null, recipe_id: "mexido", quantity: 1, unit: "g" }, foods, recipes)).toThrow(MissingSourceError);
  });
});

describe("buildMealPayload", () => {
  const stored = [
    { id: "i1", food_id: "pao", recipe_id: null, quantity: 50, unit: "g" as const },
    { id: "i2", food_id: "ovo", recipe_id: null, quantity: 1, unit: "unidade" as const },
  ];

  it("itens novos recebem snapshot calculado", () => {
    const [item] = buildMealPayload([{ id: null, food_id: "pao", recipe_id: null, quantity: 100, unit: "g" }], [], foods, recipes);
    expect(item.snapshot).toMatchObject({ name: "Pão francês", calories: 300, carbs_g: 58, fiber_g: null });
    expect(item.snapshot?.incomplete_nutrients).toEqual(["fiber_g", "saturated_fat_g", "sodium_mg"]);
  });

  it("itens inalterados mantêm o snapshot histórico (null); alterados são recalculados", () => {
    const payload = buildMealPayload(
      [
        { ...stored[1] }, // inalterado (reordenado)
        { ...stored[0], quantity: 100 }, // alterado
      ],
      stored,
      foods,
      recipes,
    );
    expect(payload[0].snapshot).toBeNull();
    expect(payload[1].snapshot?.calories).toBe(300);
  });

  it("trocar a unidade conta como alteração", () => {
    const [item] = buildMealPayload([{ ...stored[0], quantity: 1, unit: "unidade" }], stored, foods, recipes);
    expect(item.snapshot?.calories).toBe(150);
  });

  it("rejeita id de item que não pertence à refeição", () => {
    expect(() => buildMealPayload([{ ...stored[0], id: "outro" }], stored, foods, recipes)).toThrow(MissingSourceError);
  });
});

describe("totais a partir de snapshots", () => {
  it("soma calorias e marca parciais", () => {
    const a = { calories: 150, carbs_g: 29, protein_g: 4, fiber_g: null, fat_g: 1.5, saturated_fat_g: null, sodium_mg: null, incomplete_nutrients: ["fiber_g", "saturated_fat_g", "sodium_mg"] };
    const b = { calories: 70, carbs_g: 0.4, protein_g: 6.3, fiber_g: 0, fat_g: 4.8, saturated_fat_g: 1.6, sodium_mg: 70, incomplete_nutrients: [] };
    const total = totalsFromSnapshots([a, b]);
    expect(total.calories).toBe(220);
    expect(total.nutrients.fiber_g).toBe(0);
    expect(total.incomplete).toEqual(["fiber_g", "saturated_fat_g", "sodium_mg"]);
    expect(total.nutrients.protein_g).toBeCloseTo(10.3);
    expect(total).toEqual(expect.objectContaining({ calories: foodNutrition(pao, 50, "g").calories + 70 }));
  });
});

describe("mealLabel", () => {
  it("usa o nome personalizado", () => {
    expect(mealLabel({ meal_type: "almoco", custom_name: null })).toBe("Almoço");
    expect(mealLabel({ meal_type: "personalizada", custom_name: "Pré-treino" })).toBe("Pré-treino");
  });
});
