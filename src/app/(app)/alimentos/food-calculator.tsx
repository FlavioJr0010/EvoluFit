"use client";

import { useState } from "react";

import { NutritionFacts } from "@/components/nutrition/nutrition-facts";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Food } from "@/lib/data/foods";
import { allowedUnits, foodNutrition } from "@/lib/nutrition/calc";
import { UNIT_LABELS, type FoodUnit } from "@/lib/nutrition/types";
import { parseDecimalPtBR } from "@/lib/validation/decimal";

/** Mostra os valores proporcionais para uma quantidade qualquer. */
export function FoodCalculator({ food }: { food: Food }) {
  const units = allowedUnits(food);
  const [quantity, setQuantity] = useState(String(food.base_quantity).replace(".", ","));
  const [unit, setUnit] = useState<FoodUnit>(food.base_unit);
  const parsed = parseDecimalPtBR(quantity);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input aria-label="Quantidade" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10 w-28" />
        <NativeSelect aria-label="Unidade" value={unit} onChange={(e) => setUnit(e.target.value as FoodUnit)} className="[&_select]:h-10">
          {units.map((u) => (
            <NativeSelectOption key={u} value={u}>
              {UNIT_LABELS[u]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {parsed != null && parsed > 0 ? (
        <NutritionFacts nutrition={foodNutrition(food, parsed, unit)} />
      ) : (
        <p className="text-sm text-muted-foreground">Informe uma quantidade maior que zero.</p>
      )}
    </div>
  );
}
