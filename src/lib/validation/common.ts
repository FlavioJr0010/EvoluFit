import { z } from "zod";

import { isDateString } from "@/lib/dates";

export const dateSchema = z.string().refine(isDateString, "Data inválida.");

export const uuidSchema = z.uuid("Registro inválido.");

/** Texto opcional: vazio vira null. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v));
}

export function requiredText(max: number, message = "Campo obrigatório.") {
  return z.string().trim().min(1, message).max(max, `Use até ${max} caracteres.`);
}
