"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { Checkin } from "@/lib/data/checkins";
import { toInputValue } from "@/lib/format";
import { initialFormState } from "@/lib/forms";

import { saveCheckin } from "./actions";

export function CheckinForm({ date, checkin }: { date: string; checkin: Checkin | null }) {
  const [state, action, pending] = useActionState(saveCheckin, initialFormState);
  const v = state.values;

  return (
    <form action={action} className="flex flex-col gap-4" key={`${date}-${checkin?.id ?? "novo"}`}>
      <input type="hidden" name="date" value={date} />
      <FormMessage state={state} />
      <TextField
        name="weight_kg"
        label="Peso (kg)"
        inputMode="decimal"
        placeholder="ex.: 80,4"
        defaultValue={v?.weight_kg ?? toInputValue(checkin?.weight_kg)}
        errors={state.fieldErrors?.weight_kg}
      />
      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <TextField
          name="water"
          label="Água (total do dia)"
          inputMode="decimal"
          placeholder="ex.: 2000"
          defaultValue={v?.water ?? toInputValue(checkin?.water_ml)}
          errors={state.fieldErrors?.water}
        />
        <SelectField
          name="water_unit"
          label="Unidade"
          defaultValue={v?.water_unit ?? "ml"}
          options={[
            { value: "ml", label: "ml" },
            { value: "L", label: "L" },
          ]}
        />
      </div>
      <TextareaField name="notes" label="Observação (opcional)" defaultValue={v?.notes ?? checkin?.notes ?? ""} maxLength={1000} errors={state.fieldErrors?.notes} />
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Salvando…" : checkin ? "Atualizar registro" : "Salvar registro"}
      </Button>
    </form>
  );
}
