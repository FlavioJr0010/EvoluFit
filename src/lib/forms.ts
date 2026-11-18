import type { z } from "zod";

/** Estado padrão devolvido pelas Server Actions de formulário. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores para repopular campos após erro (nunca senhas). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export function fieldErrorsFrom(error: z.ZodError): FormState["fieldErrors"] {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

/**
 * Lê um campo de texto do FormData. Campos ausentes ou arquivos viram "",
 * para que a validação Zod mostre as mensagens em português.
 */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
