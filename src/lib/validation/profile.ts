import { z } from "zod";

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(80, "Use até 80 caracteres.")
    .transform((v) => (v === "" ? null : v)),
  timezone: z.string().refine(isValidTimeZone, "Fuso horário inválido."),
});
