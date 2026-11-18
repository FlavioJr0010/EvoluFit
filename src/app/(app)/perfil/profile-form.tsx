"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/forms";

import { updateProfile } from "./actions";

export function ProfileForm({
  profile,
  timezones,
}: {
  profile: { displayName: string | null; timezone: string };
  timezones: string[];
}) {
  const [state, action, pending] = useActionState(updateProfile, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <TextField
        name="display_name"
        label="Nome (opcional)"
        defaultValue={profile.displayName ?? ""}
        maxLength={80}
        errors={state.fieldErrors?.display_name}
      />
      <SelectField
        name="timezone"
        label="Fuso horário"
        defaultValue={profile.timezone}
        options={timezones.map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }))}
        errors={state.fieldErrors?.timezone}
      />
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
