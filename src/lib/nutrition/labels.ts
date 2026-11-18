import { formatNumber } from "@/lib/format";

import { UNIT_LABELS, type QuantityUnit } from "./types";

/** "100 g", "1 unidade", "2 unidades", "0,5 porção" */
export function formatQuantity(quantity: number, unit: QuantityUnit): string {
  const label =
    unit === "unidade" ? (quantity === 1 ? "unidade" : "unidades") : unit === "porcao" ? (quantity === 1 ? "porção" : "porções") : UNIT_LABELS[unit];
  return `${formatNumber(quantity, 2)} ${label}`;
}
