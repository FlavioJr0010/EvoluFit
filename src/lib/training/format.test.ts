import { describe, expect, it } from "vitest";

import { formatSet, formatVolume, summarizeSets } from "./format";

describe("formatação de séries", () => {
  it("com e sem carga", () => {
    expect(formatSet({ load_kg: 22.5, reps: 10 })).toBe("22,5 kg × 10");
    expect(formatSet({ load_kg: null, reps: 12 })).toBe("× 12");
  });

  it("resume só séries válidas", () => {
    expect(
      summarizeSets([
        { load_kg: 60, reps: 15, is_warmup: true },
        { load_kg: 120, reps: 10, is_warmup: false },
        { load_kg: null, reps: 8, is_warmup: false },
      ]),
    ).toBe("120×10, 8 reps");
    expect(formatVolume(3280)).toBe("3.280 kg");
  });
});
