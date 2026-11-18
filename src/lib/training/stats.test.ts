import { describe, expect, it } from "vitest";

import { comparePeriods, exerciseStats, summarizePeriod, workoutVolume, type SetData } from "./stats";

const s = (load_kg: number | null, reps: number, is_warmup = false): SetData => ({ load_kg, reps, is_warmup });

// Exemplo da especificação: leg press 120x10, 130x8, 130x8
const legPress = [s(120, 10), s(130, 8), s(130, 8)];

describe("exerciseStats", () => {
  it("calcula volume, maior carga, séries e repetições (exemplo da especificação)", () => {
    expect(exerciseStats(legPress)).toEqual({
      totalSets: 3,
      totalReps: 26,
      avgRepsPerSet: 26 / 3,
      maxLoad: 130,
      volume: 120 * 10 + 130 * 8 + 130 * 8, // 3280
      warmupSets: 0,
    });
  });

  it("aquecimento fica fora de totais, volume e maior carga", () => {
    const stats = exerciseStats([s(200, 5, true), ...legPress]);
    expect(stats.totalSets).toBe(3);
    expect(stats.volume).toBe(3280);
    expect(stats.maxLoad).toBe(130);
    expect(stats.warmupSets).toBe(1);
  });

  it("exercício sem carga conta séries e repetições, mas não volume", () => {
    expect(exerciseStats([s(null, 12), s(null, 10)])).toEqual({
      totalSets: 2,
      totalReps: 22,
      avgRepsPerSet: 11,
      maxLoad: null,
      volume: 0,
      warmupSets: 0,
    });
  });

  it("lida com exercício sem séries válidas", () => {
    expect(exerciseStats([s(50, 10, true)])).toMatchObject({ totalSets: 0, avgRepsPerSet: null, volume: 0 });
  });

  it("volume do treino soma os exercícios", () => {
    expect(workoutVolume([{ sets: legPress }, { sets: [s(20, 10)] }, { sets: [s(null, 10)] }])).toBe(3480);
  });
});

describe("comparePeriods", () => {
  const before = { from: "2026-10-01", to: "2026-10-31" };
  const after = { from: "2026-11-01", to: "2026-11-30" };

  it("não afirma tendência com menos de 2 sessões em algum período", () => {
    const result = comparePeriods(
      [
        { date: "2026-10-05", sets: legPress },
        { date: "2026-10-12", sets: legPress },
        { date: "2026-11-05", sets: [s(140, 10)] },
      ],
      before,
      after,
    );
    expect(result.status).toBe("insufficient");
    expect(result.b.sessions).toBe(1);
  });

  it("identifica progressão de carga, volume e repetições", () => {
    const result = comparePeriods(
      [
        { date: "2026-10-05", sets: [s(100, 10), s(100, 10)] },
        { date: "2026-10-12", sets: [s(110, 8), s(110, 8)] },
        { date: "2026-11-05", sets: [s(120, 10), s(120, 10)] },
        { date: "2026-11-12", sets: [s(120, 10), s(120, 10)] },
      ],
      before,
      after,
    );
    expect(result).toMatchObject({ status: "ok", load: "up", volume: "up", reps: "up" });
    expect(result.a).toEqual({ sessions: 2, maxLoad: 110, avgVolume: 1880, avgReps: 18 });
    expect(result.b).toEqual({ sessions: 2, maxLoad: 120, avgVolume: 2400, avgReps: 20 });
  });

  it("indica estabilidade e queda", () => {
    const result = comparePeriods(
      [
        { date: "2026-10-05", sets: [s(100, 10)] },
        { date: "2026-10-12", sets: [s(100, 10)] },
        { date: "2026-11-05", sets: [s(100, 8)] },
        { date: "2026-11-12", sets: [s(100, 8)] },
      ],
      before,
      after,
    );
    expect(result).toMatchObject({ status: "ok", load: "equal", volume: "down", reps: "down" });
  });

  it("sessões só de aquecimento não contam como sessão", () => {
    const summary = summarizePeriod(
      [
        { date: "2026-11-05", sets: [s(50, 10, true)] },
        { date: "2026-11-06", sets: [s(100, 10)] },
      ],
      after,
    );
    expect(summary.sessions).toBe(1);
  });

  it("exercício sem carga compara repetições, sem tendência de carga/volume", () => {
    const result = comparePeriods(
      [
        { date: "2026-10-05", sets: [s(null, 8)] },
        { date: "2026-10-12", sets: [s(null, 8)] },
        { date: "2026-11-05", sets: [s(null, 10)] },
        { date: "2026-11-12", sets: [s(null, 12)] },
      ],
      before,
      after,
    );
    expect(result).toMatchObject({ status: "ok", load: "n/a", volume: "n/a", reps: "up" });
  });
});
