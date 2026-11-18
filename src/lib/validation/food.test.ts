import { describe, expect, it } from "vitest";

import { foodSchema, recipeSchema } from "./food";

const base = {
  name: "Melão",
  base_unit: "g",
  base_quantity: "100",
  unit_weight: "",
  unit_weight_unit: "",
  calories: "34",
  carbs_g: "8,2",
  protein_g: "",
  fiber_g: "0,9",
  fat_g: "",
  saturated_fat_g: "",
  sodium_mg: "",
  notes: "",
};

describe("foodSchema", () => {
  it("calorias obrigatórias, nutrientes opcionais (vazio = null)", () => {
    const food = foodSchema.parse(base);
    expect(food).toMatchObject({ calories: 34, carbs_g: 8.2, fiber_g: 0.9, protein_g: null, unit_weight: null, unit_weight_unit: null });
    expect(foodSchema.safeParse({ ...base, calories: "" }).success).toBe(false);
  });

  it("aceita zero como valor informado", () => {
    expect(foodSchema.parse({ ...base, protein_g: "0" }).protein_g).toBe(0);
  });

  it("rejeita negativos e base zero", () => {
    expect(foodSchema.safeParse({ ...base, calories: "-1" }).success).toBe(false);
    expect(foodSchema.safeParse({ ...base, base_quantity: "0" }).success).toBe(false);
    expect(foodSchema.safeParse({ ...base, carbs_g: "-2" }).success).toBe(false);
  });

  it("peso por unidade com base em g usa a própria base", () => {
    expect(foodSchema.parse({ ...base, unit_weight: "50", unit_weight_unit: "ml" })).toMatchObject({
      unit_weight: 50,
      unit_weight_unit: "g",
    });
  });

  it("peso por unidade com base em unidade exige g ou ml", () => {
    const result = foodSchema.safeParse({ ...base, base_unit: "unidade", base_quantity: "1", unit_weight: "50" });
    expect(result.success).toBe(false);
    expect(foodSchema.parse({ ...base, base_unit: "unidade", base_quantity: "1", unit_weight: "50", unit_weight_unit: "g" }).unit_weight_unit).toBe("g");
  });

  it("saturadas não podem exceder gorduras totais", () => {
    const result = foodSchema.safeParse({ ...base, fat_g: "2", saturated_fat_g: "3" });
    expect(result.error?.issues[0]?.path).toEqual(["saturated_fat_g"]);
  });
});

describe("recipeSchema", () => {
  const id = "4b1e7a2a-5d0b-4f7e-9f5e-2b8a1c3d4e5f";
  it("exige ingrediente e rendimento positivo", () => {
    expect(recipeSchema.safeParse({ id: null, name: "Ovo mexido", servings: "1", notes: "", items: [] }).success).toBe(false);
    expect(
      recipeSchema.safeParse({ id: null, name: "Ovo mexido", servings: "0", notes: "", items: [{ food_id: id, quantity: "2", unit: "unidade" }] }).success,
    ).toBe(false);
    expect(
      recipeSchema.parse({ id: null, name: "Ovo mexido", servings: "1", notes: "", items: [{ food_id: id, quantity: "2", unit: "unidade" }] }).items[0],
    ).toEqual({ food_id: id, quantity: 2, unit: "unidade" });
  });
});
