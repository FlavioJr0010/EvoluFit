import { isWithin, type DateRange } from "@/lib/dates";

import { comparePeriods, exerciseStats, type ExerciseSession, type PeriodComparison } from "./stats";

export type ExerciseReportRow = {
  exerciseId: string;
  name: string;
  sessions: number;
  sets: number;
  reps: number;
  maxLoad: number | null;
  volume: number;
  comparison: PeriodComparison;
};

/**
 * Relatório por exercício no período `current`, com comparação contra o
 * período `previous` (mesmo tamanho, imediatamente anterior).
 */
export function exerciseReport(
  sessionsByExercise: Map<string, ExerciseSession[]>,
  names: Map<string, string>,
  current: DateRange,
  previous: DateRange,
): ExerciseReportRow[] {
  const rows: ExerciseReportRow[] = [];
  for (const [exerciseId, sessions] of sessionsByExercise) {
    const inPeriod = sessions.filter((s) => isWithin(s.date, current));
    if (inPeriod.length === 0) continue;
    const stats = inPeriod.map((s) => exerciseStats(s.sets));
    const loads = stats.map((s) => s.maxLoad).filter((l): l is number => l != null);
    rows.push({
      exerciseId,
      name: names.get(exerciseId) ?? "Exercício",
      sessions: inPeriod.length,
      sets: stats.reduce((sum, s) => sum + s.totalSets, 0),
      reps: stats.reduce((sum, s) => sum + s.totalReps, 0),
      maxLoad: loads.length ? Math.max(...loads) : null,
      volume: stats.reduce((sum, s) => sum + s.volume, 0),
      comparison: comparePeriods(sessions, previous, current),
    });
  }
  return rows.sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, "pt-BR"));
}

/** Série temporal por sessão: maior carga, volume e repetições (sem aquecimento). */
export function sessionSeries(sessions: ExerciseSession[], range: DateRange) {
  return sessions
    .filter((s) => isWithin(s.date, range))
    .map((s) => {
      const stats = exerciseStats(s.sets);
      return { date: s.date, maxLoad: stats.maxLoad, volume: stats.volume, reps: stats.totalReps, sets: stats.totalSets };
    })
    .filter((p) => p.sets > 0);
}
