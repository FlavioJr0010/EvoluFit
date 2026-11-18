import { addDays } from "@/lib/dates";

export type WeightPoint = { date: string; weight: number };

export const MOVING_AVERAGE_WINDOW_DAYS = 7;
export const MOVING_AVERAGE_MIN_POINTS = 4;

/**
 * Média móvel semanal: para cada pesagem, média das pesagens dos últimos
 * 7 dias corridos (inclusive). Só existe com ao menos 4 pesagens na janela.
 */
export function weightMovingAverage(points: WeightPoint[]): (WeightPoint & { average: number | null })[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((point) => {
    const from = addDays(point.date, -(MOVING_AVERAGE_WINDOW_DAYS - 1));
    const window = sorted.filter((p) => p.date >= from && p.date <= point.date);
    const average =
      window.length >= MOVING_AVERAGE_MIN_POINTS
        ? window.reduce((sum, p) => sum + p.weight, 0) / window.length
        : null;
    return { ...point, average };
  });
}

/** Diferença entre a primeira e a última pesagem do período. */
export function weightChange(points: WeightPoint[]) {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return { first, last, diff: last.weight - first.weight };
}

/** Média de água por dia com registro. */
export function averageWater(values: { date: string; water_ml: number }[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v.water_ml, 0) / values.length;
}
