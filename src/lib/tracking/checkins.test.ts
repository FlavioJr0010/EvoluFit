import { describe, expect, it } from "vitest";

import { averageWater, weightChange, weightMovingAverage } from "./checkins";

describe("weightMovingAverage", () => {
  it("só calcula com 4+ pesagens nos últimos 7 dias corridos", () => {
    const result = weightMovingAverage([
      { date: "2026-11-01", weight: 80 },
      { date: "2026-11-02", weight: 81 },
      { date: "2026-11-03", weight: 79 },
      { date: "2026-11-04", weight: 80 },
      { date: "2026-11-10", weight: 78 },
    ]);
    expect(result.map((r) => r.average)).toEqual([null, null, null, 80, null]);
  });

  it("a janela é de 7 dias corridos, incluindo o dia", () => {
    const result = weightMovingAverage([
      { date: "2026-11-01", weight: 70 }, // fora da janela de 08/11
      { date: "2026-11-02", weight: 80 },
      { date: "2026-11-04", weight: 80 },
      { date: "2026-11-06", weight: 80 },
      { date: "2026-11-08", weight: 84 },
    ]);
    expect(result.at(-1)?.average).toBe(81);
  });

  it("ordena por data", () => {
    const result = weightMovingAverage([
      { date: "2026-11-03", weight: 1 },
      { date: "2026-11-01", weight: 2 },
    ]);
    expect(result.map((r) => r.date)).toEqual(["2026-11-01", "2026-11-03"]);
  });
});

describe("weightChange", () => {
  it("diferença entre a primeira e a última pesagem", () => {
    expect(
      weightChange([
        { date: "2026-11-10", weight: 78.4 },
        { date: "2026-11-01", weight: 80 },
        { date: "2026-11-05", weight: 82 },
      ]),
    ).toMatchObject({ first: { weight: 80 }, last: { weight: 78.4 }, diff: expect.closeTo(-1.6) });
  });

  it("exige ao menos duas pesagens", () => {
    expect(weightChange([{ date: "2026-11-01", weight: 80 }])).toBeNull();
  });
});

describe("averageWater", () => {
  it("média dos dias com registro", () => {
    expect(averageWater([{ date: "a", water_ml: 2000 }, { date: "b", water_ml: 3000 }])).toBe(2500);
    expect(averageWater([])).toBeNull();
  });
});
