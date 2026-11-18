import { describe, expect, it } from "vitest";

import { formatKcal, formatNumber, formatNutrient, formatSignedKg, formatWater, toInputValue } from "./format";

describe("formatação pt-BR", () => {
  it("números", () => {
    expect(formatNumber(1234.56)).toBe("1.234,6");
    expect(formatKcal(175.6)).toBe("176 kcal");
    expect(toInputValue(8.2)).toBe("8,2");
    expect(toInputValue(null)).toBe("");
  });

  it("peso com sinal", () => {
    expect(formatSignedKg(1.234)).toBe("+1,23 kg");
    expect(formatSignedKg(-0.8)).toBe("−0,8 kg");
    expect(formatSignedKg(0.001)).toBe("0 kg");
  });

  it("água em ml ou litros", () => {
    expect(formatWater(750)).toBe("750 ml");
    expect(formatWater(2500)).toBe("2,5 L");
  });

  it("nutrientes: ausente, completo e parcial", () => {
    expect(formatNutrient(null, "g")).toBe("—");
    expect(formatNutrient(12.34, "g")).toBe("12,3 g");
    expect(formatNutrient(12.34, "g", true)).toBe("≥ 12,3 g");
    expect(formatNutrient(1234.4, "mg")).toBe("1.234 mg");
  });
});

describe("capitalizeFirst", () => {
  it("só a primeira letra", async () => {
    const { capitalizeFirst } = await import("./format");
    expect(capitalizeFirst("quarta-feira, 18 de novembro")).toBe("Quarta-feira, 18 de novembro");
  });
});
