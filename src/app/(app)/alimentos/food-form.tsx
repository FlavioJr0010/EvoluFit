"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import type { Food } from "@/lib/data/foods";
import { toInputValue } from "@/lib/format";
import { initialFormState } from "@/lib/forms";
import { NUTRIENT_KEYS, NUTRIENTS } from "@/lib/nutrition/types";

import { saveFood } from "./actions";

const UNIT_OPTIONS = [
  { value: "g", label: "gramas (g)" },
  { value: "ml", label: "mililitros (ml)" },
  { value: "unidade", label: "unidade" },
];

export function FoodForm({ food }: { food?: Food }) {
  const [state, action, pending] = useActionState(saveFood, initialFormState);
  const v = state.values;
  const e = state.fieldErrors;
  const [baseUnit, setBaseUnit] = useState<string>(v?.base_unit ?? food?.base_unit ?? "g");

  const value = (key: keyof Food & string) => v?.[key] ?? (food ? toInputValue(food[key] as number | null) : "");

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {food ? <input type="hidden" name="id" value={food.id} /> : null}
      <FormMessage state={state} />
      <TextField name="name" label="Nome" required maxLength={120} defaultValue={v?.name ?? food?.name ?? ""} errors={e?.name} placeholder="ex.: Pão francês" />

      <FieldSet>
        <FieldLegend variant="label">Base de cálculo</FieldLegend>
        <p className="-mt-2 text-sm text-muted-foreground">Os nutrientes abaixo valem para esta quantidade (ex.: 100 g, 1 unidade, 15 ml).</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField name="base_quantity" label="Quantidade" inputMode="decimal" required defaultValue={value("base_quantity") || "100"} errors={e?.base_quantity} />
          <SelectField
            name="base_unit"
            label="Unidade"
            options={UNIT_OPTIONS}
            value={baseUnit}
            onChange={(ev) => setBaseUnit(ev.target.value)}
            errors={e?.base_unit}
          />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Peso por unidade (opcional)</FieldLegend>
        <p className="-mt-2 text-sm text-muted-foreground">
          {baseUnit === "unidade"
            ? "Quanto pesa 1 unidade. Permite lançar este alimento em gramas ou mililitros."
            : `Quantos ${baseUnit} tem 1 unidade. Permite lançar, por exemplo, “1 pão”.`}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TextField name="unit_weight" label="Peso de 1 unidade" inputMode="decimal" defaultValue={value("unit_weight")} errors={e?.unit_weight} />
          {baseUnit === "unidade" ? (
            <SelectField
              name="unit_weight_unit"
              label="Em"
              options={[
                { value: "g", label: "g" },
                { value: "ml", label: "ml" },
              ]}
              defaultValue={v?.unit_weight_unit ?? food?.unit_weight_unit ?? "g"}
              errors={e?.unit_weight_unit}
            />
          ) : (
            <div className="flex items-end pb-2 text-sm text-muted-foreground">{baseUnit}</div>
          )}
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Valores nutricionais da base</FieldLegend>
        <TextField name="calories" label="Calorias (kcal)" inputMode="decimal" required defaultValue={value("calories")} errors={e?.calories} />
        <p className="text-sm text-muted-foreground">Deixe em branco o que não souber. Em branco é diferente de zero.</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRIENT_KEYS.map((k) => (
            <TextField
              key={k}
              name={k}
              label={`${NUTRIENTS[k].label} (${NUTRIENTS[k].unit})`}
              inputMode="decimal"
              defaultValue={value(k)}
              errors={e?.[k]}
            />
          ))}
        </div>
      </FieldSet>

      <TextareaField name="notes" label="Observação (opcional)" maxLength={1000} defaultValue={v?.notes ?? food?.notes ?? ""} errors={e?.notes} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alimento"}
        </Button>
        {!food ? (
          <Button type="submit" name="next" value="novo" variant="outline" size="lg" disabled={pending}>
            Salvar e cadastrar outro
          </Button>
        ) : null}
      </div>
    </form>
  );
}
