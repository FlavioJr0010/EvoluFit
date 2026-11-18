"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/forms";

import { duplicateMeals } from "../actions";

export function DuplicateForm({
  sourceDate,
  targetDate,
  meals,
}: {
  sourceDate: string;
  targetDate: string;
  meals: { id: string; label: string; summary: string }[];
}) {
  const [state, action, pending] = useActionState(duplicateMeals, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="source_date" value={sourceDate} />
      <input type="hidden" name="target_date" value={targetDate} />
      <FormMessage state={state} />
      <fieldset className="flex flex-col divide-y rounded-lg border">
        <legend className="sr-only">Refeições a copiar</legend>
        {meals.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
            <input type="checkbox" name="meal_ids" value={m.id} defaultChecked className="mt-1 size-4 accent-primary" />
            <span>
              <span className="block font-medium">{m.label}</span>
              <span className="block text-sm text-muted-foreground">{m.summary}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-muted-foreground">Os itens serão recalculados com os valores atuais dos alimentos e preparações.</p>
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Copiando…" : "Copiar refeições selecionadas"}
      </Button>
    </form>
  );
}
