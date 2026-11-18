const formatters = new Map<number, Intl.NumberFormat>();

function formatter(maxDigits: number) {
  let f = formatters.get(maxDigits);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: maxDigits });
    formatters.set(maxDigits, f);
  }
  return f;
}

/** 1234.5 -> "1.234,5" */
export function formatNumber(value: number, maxDigits = 1): string {
  return formatter(maxDigits).format(value);
}

/** Valor para campos de formulário: 8.2 -> "8,2"; null -> "". */
export function toInputValue(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

export const formatKcal = (value: number) => `${formatNumber(value, 0)} kcal`;

export const formatKg = (value: number) => `${formatNumber(value, 2)} kg`;

/** Diferença com sinal: +1,2 kg / −0,8 kg */
export function formatSignedKg(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0 kg";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), 2)} kg`;
}

/** 750 -> "750 ml"; 2500 -> "2,5 L" */
export function formatWater(ml: number): string {
  return ml >= 1000 ? `${formatNumber(ml / 1000, 2)} L` : `${formatNumber(ml, 0)} ml`;
}

/**
 * Valor de nutriente com indicação de total parcial.
 * null -> "—"; parcial -> "≥ 12,3 g"
 */
export function formatNutrient(value: number | null, unit: "g" | "mg", partial = false): string {
  if (value == null) return "—";
  const text = `${formatNumber(value, unit === "mg" ? 0 : 1)} ${unit}`;
  return partial ? `≥ ${text}` : text;
}

/** Primeira letra maiúscula (o `text-transform: capitalize` capitaliza todas as palavras). */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}
