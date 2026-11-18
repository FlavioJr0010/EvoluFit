import type { ComponentProps } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Option = { value: string; label: string };

export function SelectField({
  name,
  label,
  options,
  errors,
  description,
  placeholder,
  ...props
}: Omit<ComponentProps<typeof NativeSelect>, "name" | "id"> & {
  name: string;
  label: string;
  options: readonly Option[];
  errors?: string[];
  description?: string;
  placeholder?: string;
}) {
  const id = `field-${name}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        name={name}
        aria-invalid={invalid || undefined}
        className="w-full [&_select]:h-10 md:[&_select]:h-9"
        {...props}
      >
        {placeholder ? <NativeSelectOption value="">{placeholder}</NativeSelectOption> : null}
        {options.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={errors?.map((message) => ({ message }))} />
    </Field>
  );
}
