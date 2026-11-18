import { z } from "zod";

/**
 * Converte texto numérico em pt-BR para number.
 * Aceita "8,2", "8.2", "1.234,5" e " 120 ". Rejeita formatos ambíguos
 * ou inválidos ("1,2,3", "abc", "1e5", "") retornando null.
 */
export function parseDecimalPtBR(raw: string): number | null {
  const value = raw.trim().replace(/\s+/g, "");
  if (value === "") return null;

  let normalized: string;
  if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) {
    // Milhar com ponto e decimal com vírgula: 1.234,5
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if (/^[+-]?\d+(,\d+)?$/.test(value)) {
    normalized = value.replace(",", ".");
  } else if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
    normalized = value;
  } else {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Schema Zod para campos decimais vindos de formulários (FormData).
 * Uso: decimalPtBR().pipe(z.number().min(0))
 */
export function decimalPtBR(message = "Informe um número válido (ex.: 8,2).") {
  return z
    .union([z.string(), z.number()])
    .transform((input, ctx) => {
      if (typeof input === "number") return input;
      const parsed = parseDecimalPtBR(input);
      if (parsed === null) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return parsed;
    });
}

/**
 * Decimal opcional: string vazia vira null (ex.: nutriente "não cadastrado").
 */
export function optionalDecimalPtBR(
  message = "Informe um número válido (ex.: 8,2).",
) {
  return z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((input, ctx) => {
      if (input === null || input === undefined) return null;
      if (typeof input === "number") return input;
      if (input.trim() === "") return null;
      const parsed = parseDecimalPtBR(input);
      if (parsed === null) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return parsed;
    });
}
