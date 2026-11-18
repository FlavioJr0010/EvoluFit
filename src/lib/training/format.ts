import { formatNumber } from "@/lib/format";

import type { SetData } from "./stats";

/** "120 kg × 10" | "× 12" (sem carga) */
export function formatSet(set: Pick<SetData, "load_kg" | "reps">): string {
  return set.load_kg == null ? `× ${set.reps}` : `${formatNumber(set.load_kg, 2)} kg × ${set.reps}`;
}

/** Resumo das séries válidas: "120×10, 130×8, 130×8" */
export function summarizeSets(sets: SetData[]): string {
  const working = sets.filter((s) => !s.is_warmup);
  return working.map((s) => (s.load_kg == null ? `${s.reps} reps` : `${formatNumber(s.load_kg, 2)}×${s.reps}`)).join(", ");
}

export const formatVolume = (kg: number) => `${formatNumber(kg, 0)} kg`;
