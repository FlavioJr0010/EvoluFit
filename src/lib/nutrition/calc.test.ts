import { describe, expect, it } from "vitest";

import {
  allowedUnits,
  foodNutrition,
  fromSnapshot,
  recipePerServing,
  roundNutrition,
  scaleNutrition,
  sumNutrition,
  toBaseQuantity,
  toSnapshot,
  UnitConversionError,
} from "./calc";
import type { FoodNutritionSource } from "./types";

const food = (overrides: Partial<FoodNutritionSource>): FoodNutritionSource => ({
  name: "Alimento",
  base_unit: "g",
  base_quantity: 100,
  unit_weight: null,
  unit_weight_unit: null,
  calories: 0,
  carbs_g: null,
  protein_g: null,
  fiber_g: null,
  fat_g: null,
  saturated_fat_g: null,
  sodium_mg: null,
  ...overrides,
});

// Exemplo da especificação: melão, 34 kcal, 8,2 g carb, 0,9 g fibra por 100 g
const melao = food({ name: "Melão", calories: 34, carbs_g: 8.2, fiber_g: 0.9 });
const ovo = food({
  name: "Ovo",
  base_unit: "unidade",
  base_quantity: 1,
  unit_weight: 50,
  unit_weight_unit: "g",
  calories: 70,
  protein_g: 6.3,
  fat_g: 4.8,
  saturated_fat_g: 1.6,
  carbs_g: 0.4,
  sodium_mg: 70,
});
const manteiga = food({
  name: "Manteiga",
  base_unit: "g",
  base_quantity: 10,
  calories: 72,
  fat_g: 8.1,
  saturated_fat_g: 5.1,
  sodium_mg: 58,
  protein_g: 0.1,
});
const pao = food({ name: "Pão francês", base_quantity: 50, calories: 150, unit_weight: 50, unit_weight_unit: "g" });

describe("cálculo proporcional", () => {
  it("melão: 150 g multiplica tudo por 1,5 (exemplo da especificação)", () => {
    const n = roundNutrition(foodNutrition(melao, 150, "g"));
    expect(n.calories).toBe(51);
    expect(n.nutrients.carbs_g).toBe(12.3);
    expect(n.nutrients.fiber_g).toBe(1.35);
  });

  it("nutriente não cadastrado fica null e marcado como incompleto (diferente de zero)", () => {
    const n = foodNutrition(melao, 100, "g");
    expect(n.nutrients.protein_g).toBeNull();
    expect(n.incomplete).toContain("protein_g");
    const zero = foodNutrition(food({ calories: 10, protein_g: 0 }), 100, "g");
    expect(zero.nutrients.protein_g).toBe(0);
    expect(zero.incomplete).not.toContain("protein_g");
  });

  it("quantidade-base diferente de 100 (manteiga por 10 g)", () => {
    expect(roundNutrition(foodNutrition(manteiga, 5, "g")).calories).toBe(36);
  });
});

describe("conversão de unidades (peso por unidade)", () => {
  it("lista as unidades permitidas", () => {
    expect(allowedUnits(melao)).toEqual(["g"]);
    expect(allowedUnits(pao)).toEqual(["g", "unidade"]);
    expect(allowedUnits(ovo)).toEqual(["unidade", "g"]);
  });

  it("1 pão cadastrado em gramas", () => {
    expect(toBaseQuantity(pao, 1, "unidade")).toBe(50);
    expect(foodNutrition(pao, 2, "unidade").calories).toBe(300);
  });

  it("ovo cadastrado por unidade, lançado em gramas", () => {
    expect(toBaseQuantity(ovo, 100, "g")).toBe(2);
    expect(foodNutrition(ovo, 100, "g").calories).toBe(140);
  });

  it("rejeita unidade incompatível", () => {
    expect(() => foodNutrition(melao, 1, "unidade")).toThrow(UnitConversionError);
    expect(() => foodNutrition(pao, 1, "ml")).toThrow(UnitConversionError);
    expect(() => foodNutrition(melao, 1, "porcao")).toThrow(UnitConversionError);
  });
});

describe("somas e totais parciais", () => {
  it("soma calorias e marca nutrientes parciais", () => {
    const total = sumNutrition([foodNutrition(melao, 100, "g"), foodNutrition(ovo, 1, "unidade")]);
    expect(total.calories).toBe(104);
    // carboidrato: ambos têm -> completo
    expect(total.nutrients.carbs_g).toBeCloseTo(8.6);
    expect(total.incomplete).not.toContain("carbs_g");
    // proteína: só o ovo tem -> soma conhecida e parcial
    expect(total.nutrients.protein_g).toBeCloseTo(6.3);
    expect(total.incomplete).toContain("protein_g");
  });

  it("nutriente que nenhum item tem fica null e incompleto", () => {
    const total = sumNutrition([foodNutrition(pao, 50, "g")]);
    expect(total.nutrients.fiber_g).toBeNull();
    expect(total.incomplete).toContain("fiber_g");
  });

  it("total vazio tem zero calorias e nenhum nutriente", () => {
    const total = sumNutrition([]);
    expect(total.calories).toBe(0);
    expect(total.nutrients.carbs_g).toBeNull();
    expect(total.incomplete).toEqual([]);
  });

  it("propaga a parcialidade de subtotais", () => {
    const partial = sumNutrition([foodNutrition(melao, 100, "g"), foodNutrition(ovo, 1, "unidade")]);
    const complete = foodNutrition(food({ calories: 1, protein_g: 1 }), 100, "g");
    expect(sumNutrition([partial, complete]).incomplete).toContain("protein_g");
  });
});

describe("receitas", () => {
  it("ovo mexido (2 ovos + 5 g de manteiga) soma os ingredientes sem duplicar", () => {
    const porcao = roundNutrition(
      recipePerServing(
        [
          { food: ovo, quantity: 2, unit: "unidade" },
          { food: manteiga, quantity: 5, unit: "g" },
        ],
        1,
      ),
    );
    expect(porcao.calories).toBe(176); // 140 + 36
    expect(porcao.nutrients.fat_g).toBe(13.65); // 9,6 + 4,05
    expect(porcao.nutrients.protein_g).toBe(12.65);
    // manteiga sem carboidrato cadastrado -> carboidrato parcial; ninguém tem fibra
    expect(porcao.incomplete).toEqual(["carbs_g", "fiber_g"]);
  });

  it("divide pelo rendimento e escala por porções consumidas (inclusive frações)", () => {
    const perServing = recipePerServing([{ food: ovo, quantity: 4, unit: "unidade" }], 2);
    expect(perServing.calories).toBe(140);
    expect(scaleNutrition(perServing, 0.5).calories).toBe(70);
  });

  it("rejeita rendimento inválido", () => {
    expect(() => recipePerServing([], 0)).toThrow(RangeError);
  });
});

describe("snapshot", () => {
  it("arredonda para 2 casas e faz ida e volta", () => {
    const n = foodNutrition(melao, 33, "g");
    const snap = toSnapshot("Melão", n);
    expect(snap).toMatchObject({ name: "Melão", calories: 11.22, carbs_g: 2.71, protein_g: null });
    expect(snap.incomplete_nutrients).toContain("protein_g");
    const back = fromSnapshot(snap);
    expect(back.calories).toBe(11.22);
    expect(back.incomplete).toEqual(snap.incomplete_nutrients);
  });
});
