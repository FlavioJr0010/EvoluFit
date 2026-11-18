import { addDays, diffInDays, isDateString, lastDays, type DateRange } from "./dates";

export const PERIOD_PRESETS = [
  { value: "7", label: "7 dias", days: 7 },
  { value: "30", label: "30 dias", days: 30 },
  { value: "90", label: "90 dias", days: 90 },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["value"] | "personalizado";

export const MAX_CUSTOM_DAYS = 366;
const DEFAULT_PRESET = "30";

export type ResolvedPeriod = { preset: PeriodPreset; range: DateRange; days: number };

/** Lê ?periodo=7|30|90|personalizado&de=&ate= com fallback seguro (30 dias). */
export function resolvePeriod(
  params: { periodo?: string; de?: string; ate?: string },
  today: string,
): ResolvedPeriod {
  if (params.periodo === "personalizado") {
    const { de, ate } = params;
    if (isDateString(de) && isDateString(ate) && de <= ate && diffInDays(de, ate) < MAX_CUSTOM_DAYS) {
      return { preset: "personalizado", range: { from: de, to: ate }, days: diffInDays(de, ate) + 1 };
    }
  }
  const preset = PERIOD_PRESETS.find((p) => p.value === params.periodo) ?? PERIOD_PRESETS.find((p) => p.value === DEFAULT_PRESET)!;
  return { preset: preset.value, range: lastDays(today, preset.days), days: preset.days };
}

/** Período de mesmo tamanho imediatamente anterior. */
export function previousRange(range: DateRange): DateRange {
  const days = diffInDays(range.from, range.to) + 1;
  return { from: addDays(range.from, -days), to: addDays(range.from, -1) };
}
