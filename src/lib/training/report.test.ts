import { describe, expect, it } from "vitest";

import { exerciseReport, sessionSeries } from "./report";
import type { ExerciseSession } from "./stats";

const s = (date: string, load: number | null, reps: number, warmup = false): ExerciseSession => ({
  date,
  sets: [{ load_kg: load, reps, is_warmup: warmup }],
});
const previous = { from: "2026-10-01", to: "2026-10-31" };
const current = { from: "2026-11-01", to: "2026-11-30" };

describe("exerciseReport", () => {
  const sessions = new Map([
    ["leg", [s("2026-10-05", 100, 10), s("2026-10-12", 100, 10), s("2026-11-05", 120, 10), s("2026-11-12", 130, 8)]],
    ["barra", [s("2026-11-06", null, 10)]],
    ["antigo", [s("2026-09-01", 50, 10)]],
  ]);
  const names = new Map([
    ["leg", "Leg press"],
    ["barra", "Barra fixa"],
    ["antigo", "Antigo"],
  ]);

  it("resume exercícios do período e ignora os de fora", () => {
    const rows = exerciseReport(sessions, names, current, previous);
    expect(rows.map((r) => r.name)).toEqual(["Leg press", "Barra fixa"]);
    expect(rows[0]).toMatchObject({ sessions: 2, sets: 2, reps: 18, maxLoad: 130, volume: 1200 + 1040 });
    expect(rows[1]).toMatchObject({ maxLoad: null, volume: 0 });
  });

  it("compara com o período anterior somente com dados suficientes", () => {
    const rows = exerciseReport(sessions, names, current, previous);
    expect(rows[0].comparison).toMatchObject({ status: "ok", load: "up" });
    expect(rows[1].comparison.status).toBe("insufficient");
  });
});

describe("sessionSeries", () => {
  it("uma linha por sessão no período, sem sessões só de aquecimento", () => {
    expect(sessionSeries([s("2026-11-01", 50, 10, true), s("2026-11-02", 100, 10), s("2026-10-01", 90, 10)], current)).toEqual([
      { date: "2026-11-02", maxLoad: 100, volume: 1000, reps: 10, sets: 1 },
    ]);
  });
});
