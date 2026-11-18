import { describe, expect, it } from "vitest";

import { checkinSchema } from "./checkin";

const base = { date: "2026-11-18", weight_kg: "", water: "", water_unit: "ml", notes: "" };

describe("checkinSchema", () => {
  it("aceita só peso, com vírgula", () => {
    expect(checkinSchema.parse({ ...base, weight_kg: "80,4" })).toEqual({
      date: "2026-11-18",
      weight_kg: 80.4,
      water_ml: null,
      notes: null,
    });
  });

  it("converte litros em ml", () => {
    expect(checkinSchema.parse({ ...base, water: "2,5", water_unit: "L" }).water_ml).toBe(2500);
    expect(checkinSchema.parse({ ...base, water: "750", water_unit: "ml" }).water_ml).toBe(750);
  });

  it("exige peso ou água", () => {
    const result = checkinSchema.safeParse({ ...base, notes: "só nota" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Informe o peso ou a água do dia.");
  });

  it("valida limites e data", () => {
    expect(checkinSchema.safeParse({ ...base, weight_kg: "10" }).success).toBe(false);
    expect(checkinSchema.safeParse({ ...base, water: "25", water_unit: "L" }).success).toBe(false);
    expect(checkinSchema.safeParse({ ...base, date: "2026-02-30", weight_kg: "80" }).success).toBe(false);
  });
});
