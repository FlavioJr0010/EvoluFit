"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SearchPicker } from "@/components/forms/search-picker";
import { NutritionFacts } from "@/components/nutrition/nutrition-facts";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Food, Recipe } from "@/lib/data/foods";
import { formatKcal, toInputValue } from "@/lib/format";
import { initialFormState } from "@/lib/forms";
import { allowedUnits, foodNutrition, recipePerServing, sumNutrition } from "@/lib/nutrition/calc";
import { formatQuantity } from "@/lib/nutrition/labels";
import { UNIT_LABELS, type FoodUnit } from "@/lib/nutrition/types";
import { parseDecimalPtBR } from "@/lib/validation/decimal";

import { saveRecipe } from "./actions";

type Row = { key: string; food_id: string; quantity: string; unit: FoodUnit };

let keySeq = 0;
const newKey = () => `row-${++keySeq}`;

export function RecipeEditor({ foods, recipe }: { foods: Food[]; recipe?: Recipe }) {
  const [state, action, pending] = useActionState(saveRecipe, initialFormState);
  const foodsById = useMemo(() => {
    const map = new Map(foods.map((f) => [f.id, f]));
    // ingredientes arquivados continuam visíveis na receita existente
    recipe?.items.forEach((i) => map.set(i.food.id, i.food));
    return map;
  }, [foods, recipe]);

  const [name, setName] = useState(recipe?.name ?? "");
  const [servings, setServings] = useState(toInputValue(recipe?.servings ?? 1));
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [rows, setRows] = useState<Row[]>(
    () => recipe?.items.map((i) => ({ key: newKey(), food_id: i.food.id, quantity: toInputValue(i.quantity), unit: i.unit })) ?? [],
  );

  const computed = rows.map((row) => {
    const food = foodsById.get(row.food_id);
    const qty = parseDecimalPtBR(row.quantity);
    if (!food || qty == null || qty <= 0) return null;
    try {
      return foodNutrition(food, qty, row.unit);
    } catch {
      return null;
    }
  });
  const servingsValue = parseDecimalPtBR(servings);
  const valid = computed.every(Boolean) && rows.length > 0 && servingsValue != null && servingsValue > 0;
  const total = sumNutrition(computed.filter((c) => c != null));
  const perServing =
    valid && servingsValue
      ? recipePerServing(
          rows.map((r) => ({ food: foodsById.get(r.food_id)!, quantity: parseDecimalPtBR(r.quantity)!, unit: r.unit })),
          servingsValue,
        )
      : null;

  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const payload = JSON.stringify({
    id: recipe?.id ?? null,
    name,
    servings,
    notes,
    items: rows.map(({ food_id, quantity, unit }) => ({ food_id, quantity, unit })),
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="payload" value={payload} />
      <FormMessage state={state} />

      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <Field>
          <FieldLabel htmlFor="recipe-name">Nome</FieldLabel>
          <Input id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="ex.: Ovo mexido" className="h-10" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="recipe-servings">Rendimento (porções)</FieldLabel>
          <Input id="recipe-servings" inputMode="decimal" value={servings} onChange={(e) => setServings(e.target.value)} className="h-10" />
        </Field>
      </div>

      <section aria-labelledby="ingredients-title" className="flex flex-col gap-3">
        <h2 id="ingredients-title" className="font-medium">
          Ingredientes
        </h2>
        <SearchPicker
          label="Adicionar ingrediente"
          placeholder="Buscar alimento para adicionar"
          emptyText="Nenhum alimento encontrado. Cadastre-o em Alimentos."
          options={foods.map((f) => ({ value: f.id, label: f.name, hint: `${formatKcal(f.calories)} / ${formatQuantity(f.base_quantity, f.base_unit)}` }))}
          onPick={(o) => {
            const food = foodsById.get(o.value)!;
            setRows((rs) => [...rs, { key: newKey(), food_id: food.id, quantity: toInputValue(food.base_quantity), unit: food.base_unit }]);
          }}
        />
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum ingrediente adicionado.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {rows.map((row, index) => {
              const food = foodsById.get(row.food_id);
              const n = computed[index];
              return (
                <li key={row.key} className="flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      {food?.name ?? "Alimento indisponível"}
                      {food?.archived_at ? <span className="ml-2 text-xs text-muted-foreground">(arquivado)</span> : null}
                    </span>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${food?.name ?? "ingrediente"}`} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Quantidade"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => update(row.key, { quantity: e.target.value })}
                      className="h-10 w-24"
                      aria-invalid={!n || undefined}
                    />
                    <NativeSelect aria-label="Unidade" value={row.unit} onChange={(e) => update(row.key, { unit: e.target.value as FoodUnit })} className="[&_select]:h-10">
                      {(food ? allowedUnits(food) : [row.unit]).map((u) => (
                        <NativeSelectOption key={u} value={u}>
                          {UNIT_LABELS[u]}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <span className="ml-auto text-sm tabular-nums text-muted-foreground">{n ? formatKcal(n.calories) : "—"}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Field>
        <FieldLabel htmlFor="recipe-notes">Observação (opcional)</FieldLabel>
        <Textarea id="recipe-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
      </Field>

      <div className="grid gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Receita inteira</h3>
          <NutritionFacts nutrition={total} compact />
        </div>
        <div>
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Por porção</h3>
          {perServing ? <NutritionFacts nutrition={perServing} compact /> : <p className="text-sm text-muted-foreground">Complete os ingredientes e o rendimento.</p>}
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending || !valid || !name.trim()} className="self-start">
        {pending ? "Salvando…" : "Salvar preparação"}
      </Button>
    </form>
  );
}
