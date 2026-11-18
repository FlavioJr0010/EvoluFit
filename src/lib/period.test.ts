import { describe, expect, it } from "vitest";

import { previousRange, resolvePeriod } from "./period";

const today = "2026-11-18";

describe("resolvePeriod", () => {
  it("presets", () => {
    expect(resolvePeriod({ periodo: "7" }, today)).toEqual({
      preset: "7",
      range: { from: "2026-11-12", to: today },
      days: 7,
    });
    expect(resolvePeriod({}, today).preset).toBe("30");
    expect(resolvePeriod({ periodo: "abc" }, today).preset).toBe("30");
  });

  it("personalizado válido", () => {
    expect(resolvePeriod({ periodo: "personalizado", de: "2026-01-01", ate: "2026-01-31" }, today)).toEqual({
      preset: "personalizado",
      range: { from: "2026-01-01", to: "2026-01-31" },
      days: 31,
    });
  });

  it("personalizado inválido cai no padrão", () => {
    expect(resolvePeriod({ periodo: "personalizado", de: "2026-02-01", ate: "2026-01-01" }, today).preset).toBe("30");
    expect(resolvePeriod({ periodo: "personalizado", de: "2020-01-01", ate: "2026-01-01" }, today).preset).toBe("30");
    expect(resolvePeriod({ periodo: "personalizado", de: "x", ate: "2026-01-01" }, today).preset).toBe("30");
  });
});

describe("previousRange", () => {
  it("mesmo tamanho, imediatamente antes", () => {
    expect(previousRange({ from: "2026-11-12", to: "2026-11-18" })).toEqual({ from: "2026-11-05", to: "2026-11-11" });
  });
});
