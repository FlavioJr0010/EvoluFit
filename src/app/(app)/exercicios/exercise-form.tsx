"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/lib/data/workouts";
import { initialFormState } from "@/lib/forms";
import { MUSCLE_GROUPS } from "@/lib/training/labels";

import { saveExercise } from "./actions";

export function ExerciseForm({ exercise, back }: { exercise?: Exercise; back?: string }) {
  const [state, action, pending] = useActionState(saveExercise, initialFormState);
  const v = state.values;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}
      {back ? <input type="hidden" name="back" value={back} /> : null}
      <FormMessage state={state} />
      <TextField name="name" label="Nome" required maxLength={120} placeholder="ex.: Leg press" defaultValue={v?.name ?? exercise?.name ?? ""} errors={state.fieldErrors?.name} />
      <SelectField
        name="muscle_group"
        label="Grupo muscular principal"
        placeholder="Escolha…"
        options={MUSCLE_GROUPS}
        defaultValue={v?.muscle_group ?? exercise?.muscle_group ?? ""}
        errors={state.fieldErrors?.muscle_group}
      />
      <TextField name="equipment" label="Equipamento ou máquina (opcional)" maxLength={120} defaultValue={v?.equipment ?? exercise?.equipment ?? ""} errors={state.fieldErrors?.equipment} />
      <TextareaField name="notes" label="Observações ou instruções (opcional)" maxLength={1000} defaultValue={v?.notes ?? exercise?.notes ?? ""} errors={state.fieldErrors?.notes} />
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar exercício"}
      </Button>
    </form>
  );
}
