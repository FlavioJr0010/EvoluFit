"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SearchPicker } from "@/components/forms/search-picker";
import { NutritionFacts, NutritionLine } from "@/components/nutrition/nutrition-facts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Food, Recipe } from "@/lib/data/foods";
import type { Meal } from "@/lib/data/meals";
import { formatKcal, toInputValue } from "@/lib/format";
import { initialFormState } from "@/lib/forms";
import { allowedUnits, foodNutrition, scaleNutrition, sumNutrition } from "@/lib/nutrition/calc";
import { formatQuantity } from "@/lib/nutrition/labels";
import { MEAL_TYPES, type MealType } from "@/lib/nutrition/meals";
import { UNIT_LABELS, type Nutrition, type QuantityUnit } from "@/lib/nutrition/types";
import { parseDecimalPtBR } from "@/lib/validation/decimal";

import { saveMeal } from "./actions";

type Row = {
  key: string;
  id: string | null;
  food_id: string | null;
  recipe_id: string | null;
  quantity: string;
  unit: QuantityUnit;
  /** Valores gravados e a forma original (para saber se mudou). */
  stored?: { quantity: number; unit: QuantityUnit; name: string; nutrition: Nutrition };
};

let seq = 0;
const key = () => `item-${++seq}`;

export function MealEditor({
  date,
  foods,
  recipes,
  meal,
  defaultType = "almoco",
}: {
  date: string;
  foods: Food[];
  recipes: Recipe[];
  meal?: Meal;
  defaultType?: MealType;
}) {
  const [state, action, pending] = useActionState(saveMeal, initialFormState);
  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  const [mealType, setMealType] = useState<MealType>(meal?.meal_type ?? defaultType);
  const [customName, setCustomName] = useState(meal?.custom_name ?? "");
  const [mealDate, setMealDate] = useState(meal?.date ?? date);
  const [rows, setRows] = useState<Row[]>(
    () =>
      meal?.items.map((i) => ({
        key: key(),
        id: i.id,
        food_id: i.food_id,
        recipe_id: i.recipe_id,
        quantity: toInputValue(i.quantity),
        unit: i.unit,
        stored: { quantity: i.quantity, unit: i.unit, name: i.name, nutrition: i.nutrition },
      })) ?? [],
  );

  const preview = (row: Row): { name: string; nutrition: Nutrition | null; changed: boolean } => {
    const qty = parseDecimalPtBR(row.quantity);
    const unchanged = row.stored && qty === row.stored.quantity && row.unit === row.stored.unit;
    if (unchanged) return { name: row.stored!.name, nutrition: row.stored!.nutrition, changed: false };
    const name = row.food_id ? foodsById.get(row.food_id)?.name : recipesById.get(row.recipe_id ?? "")?.name;
    if (qty == null || qty <= 0) return { name: name ?? row.stored?.name ?? "Item", nutrition: null, changed: true };
    try {
      if (row.food_id) {
        const food = foodsById.get(row.food_id);
        return { name: food?.name ?? row.stored?.name ?? "Alimento", nutrition: food ? foodNutrition(food, qty, row.unit) : null, changed: true };
      }
      const recipe = recipesById.get(row.recipe_id ?? "");
      return { name: recipe?.name ?? row.stored?.name ?? "Preparação", nutrition: recipe ? scaleNutrition(recipe.perServing, qty) : null, changed: true };
    } catch {
      return { name: name ?? "Item", nutrition: null, changed: true };
    }
  };

  const previews = rows.map(preview);
  const total = sumNutrition(previews.flatMap((p) => (p.nutrition ? [p.nutrition] : [])));
  const valid = rows.length > 0 && previews.every((p) => p.nutrition) && (mealType !== "personalizada" || customName.trim());

  const update = (k: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === k ? { ...r, ...patch } : r)));

  const options = [
    ...foods.map((f) => ({ value: `f:${f.id}`, label: f.name, hint: `${formatKcal(f.calories)} / ${formatQuantity(f.base_quantity, f.base_unit)}`, group: "alimento" })),
    ...recipes.map((r) => ({ value: `r:${r.id}`, label: r.name, hint: `${formatKcal(r.perServing.calories)} / porção`, group: "preparação" })),
  ].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const payload = JSON.stringify({
    id: meal?.id ?? null,
    date: mealDate,
    meal_type: mealType,
    custom_name: customName,
    items: rows.map(({ id, food_id, recipe_id, quantity, unit }) => ({ id, food_id, recipe_id, quantity, unit })),
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="payload" value={payload} />
      <FormMessage state={state} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="meal-type">Refeição</FieldLabel>
          <NativeSelect id="meal-type" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} className="w-full [&_select]:h-10">
            {MEAL_TYPES.map((t) => (
              <NativeSelectOption key={t.value} value={t.value}>
                {t.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {mealType === "personalizada" ? (
          <Field data-invalid={Boolean(state.fieldErrors?.custom_name) || undefined}>
            <FieldLabel htmlFor="meal-name">Nome</FieldLabel>
            <Input id="meal-name" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={60} placeholder="ex.: Pré-treino" className="h-10" />
            <FieldError errors={state.fieldErrors?.custom_name?.map((message) => ({ message }))} />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="meal-date">Data</FieldLabel>
          <Input id="meal-date" type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} className="h-10" />
        </Field>
      </div>

      <section aria-labelledby="items-title" className="flex flex-col gap-3">
        <h2 id="items-title" className="font-medium">
          Itens
        </h2>
        <SearchPicker
          label="Adicionar item"
          placeholder="Buscar alimento ou preparação"
          emptyText="Nada encontrado. Cadastre em Alimentos ou Preparações."
          options={options}
          onPick={(o) => {
            const [kind, id] = o.value.split(":");
            if (kind === "f") {
              const food = foodsById.get(id)!;
              setRows((rs) => [...rs, { key: key(), id: null, food_id: id, recipe_id: null, quantity: toInputValue(food.base_quantity), unit: food.base_unit }]);
            } else {
              setRows((rs) => [...rs, { key: key(), id: null, food_id: null, recipe_id: id, quantity: "1", unit: "porcao" }]);
            }
          }}
        />
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum item adicionado.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {rows.map((row, index) => {
              const p = previews[index];
              const food = row.food_id ? foodsById.get(row.food_id) : undefined;
              const units: QuantityUnit[] = row.recipe_id ? ["porcao"] : food ? allowedUnits(food) : [row.unit];
              return (
                <li key={row.key} className="flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      {p.name}
                      {row.recipe_id ? <span className="ml-2 text-xs text-muted-foreground">preparação</span> : null}
                    </span>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${p.name}`} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`Quantidade de ${p.name}`}
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => update(row.key, { quantity: e.target.value })}
                      className="h-10 w-24"
                      aria-invalid={!p.nutrition || undefined}
                    />
                    <NativeSelect aria-label="Unidade" value={row.unit} onChange={(e) => update(row.key, { unit: e.target.value as QuantityUnit })} className="[&_select]:h-10">
                      {units.map((u) => (
                        <NativeSelectOption key={u} value={u}>
                          {UNIT_LABELS[u]}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  {p.nutrition ? (
                    <NutritionLine nutrition={p.nutrition} />
                  ) : (
                    <span className="text-sm text-destructive">Informe uma quantidade válida.</span>
                  )}
                  {row.stored && !p.changed ? <span className="text-xs text-muted-foreground">Valores registrados no consumo.</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="mb-1 text-sm font-medium text-muted-foreground">Total da refeição</h3>
        <NutritionFacts nutrition={total} compact />
      </div>

      <Button type="submit" size="lg" disabled={pending || !valid} className="self-start">
        {pending ? "Salvando…" : "Salvar refeição"}
      </Button>
    </form>
  );
}
