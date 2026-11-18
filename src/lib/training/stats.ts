import { isWithin, type DateRange } from "@/lib/dates";

export type SetData = {
  load_kg: number | null;
  reps: number;
  is_warmup: boolean;
};

export type ExerciseStats = {
  /** Séries válidas (sem aquecimento). */
  totalSets: number;
  totalReps: number;
  avgRepsPerSet: number | null;
  /** Maior carga entre séries válidas com carga; null se nenhuma tem carga. */
  maxLoad: number | null;
  /** soma(carga × repetições) das séries válidas com carga. */
  volume: number;
  warmupSets: number;
};

/** Aquecimentos ficam fora de totais, volume e progressão. */
export function exerciseStats(sets: SetData[]): ExerciseStats {
  const working = sets.filter((s) => !s.is_warmup);
  const withLoad = working.filter((s) => s.load_kg != null);
  const totalReps = working.reduce((sum, s) => sum + s.reps, 0);
  return {
    totalSets: working.length,
    totalReps,
    avgRepsPerSet: working.length ? totalReps / working.length : null,
    maxLoad: withLoad.length ? Math.max(...withLoad.map((s) => s.load_kg!)) : null,
    volume: withLoad.reduce((sum, s) => sum + s.load_kg! * s.reps, 0),
    warmupSets: sets.length - working.length,
  };
}

/** Volume total do treino (soma dos volumes por exercício). */
export function workoutVolume(exercises: { sets: SetData[] }[]): number {
  return exercises.reduce((sum, e) => sum + exerciseStats(e.sets).volume, 0);
}

/** Uma sessão de um exercício (o exercício dentro de um treino). */
export type ExerciseSession = { date: string; sets: SetData[] };

export const MIN_SESSIONS_TO_COMPARE = 2;

export type PeriodSummary = {
  sessions: number;
  maxLoad: number | null;
  /** Média por sessão. */
  avgVolume: number;
  avgReps: number;
};

export type Trend = "up" | "down" | "equal" | "n/a";

export type PeriodComparison =
  | { status: "insufficient"; a: PeriodSummary; b: PeriodSummary }
  | {
      status: "ok";
      a: PeriodSummary;
      b: PeriodSummary;
      load: Trend;
      volume: Trend;
      reps: Trend;
    };

export function summarizePeriod(sessions: ExerciseSession[], range: DateRange): PeriodSummary {
  const inRange = sessions
    .filter((s) => isWithin(s.date, range))
    .map((s) => exerciseStats(s.sets))
    .filter((s) => s.totalSets > 0);
  const loads = inRange.map((s) => s.maxLoad).filter((l): l is number => l != null);
  const n = inRange.length;
  return {
    sessions: n,
    maxLoad: loads.length ? Math.max(...loads) : null,
    avgVolume: n ? inRange.reduce((sum, s) => sum + s.volume, 0) / n : 0,
    avgReps: n ? inRange.reduce((sum, s) => sum + s.totalReps, 0) / n : 0,
  };
}

function trend(a: number | null, b: number | null): Trend {
  if (a == null || b == null) return "n/a";
  const diff = Math.round((b - a) * 100) / 100;
  return diff > 0 ? "up" : diff < 0 ? "down" : "equal";
}

/**
 * Compara o período A (anterior) com o B (mais recente).
 * Só afirma tendência com ao menos 2 sessões em cada período.
 */
export function comparePeriods(sessions: ExerciseSession[], a: DateRange, b: DateRange): PeriodComparison {
  const sa = summarizePeriod(sessions, a);
  const sb = summarizePeriod(sessions, b);
  if (sa.sessions < MIN_SESSIONS_TO_COMPARE || sb.sessions < MIN_SESSIONS_TO_COMPARE) {
    return { status: "insufficient", a: sa, b: sb };
  }
  return {
    status: "ok",
    a: sa,
    b: sb,
    load: trend(sa.maxLoad, sb.maxLoad),
    volume: sa.avgVolume === 0 && sb.avgVolume === 0 ? "n/a" : trend(sa.avgVolume, sb.avgVolume),
    reps: trend(sa.avgReps, sb.avgReps),
  };
}
