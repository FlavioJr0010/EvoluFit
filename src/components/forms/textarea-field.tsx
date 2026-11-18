import type { ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function TextareaField({
  name,
  label,
  errors,
  ...props
}: Omit<ComponentProps<"textarea">, "name" | "id"> & { name: string; label: string; errors?: string[] }) {
  const id = `field-${name}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea id={id} name={name} aria-invalid={invalid || undefined} rows={3} {...props} />
      <FieldError errors={errors?.map((message) => ({ message }))} />
    </Field>
  );
}
