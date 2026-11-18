import { describe, expect, it } from "vitest";

import {
  addDays,
  diffInDays,
  eachDay,
  formatDate,
  formatDateLong,
  formatDateShort,
  isDateString,
  isWithin,
  lastDays,
  todayInTimeZone,
} from "./dates";

describe("todayInTimeZone", () => {
  it("usa o fuso do usuário, não o UTC do servidor", () => {
    // 22h na Bahia (UTC-3) já é o dia seguinte em UTC
    const now = new Date("2026-11-19T01:00:00Z");
    expect(todayInTimeZone("America/Bahia", now)).toBe("2026-11-18");
    expect(todayInTimeZone("UTC", now)).toBe("2026-11-19");
  });
});

describe("aritmética de datas", () => {
  it("soma dias atravessando meses e anos", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("calcula diferença e intervalos", () => {
    expect(diffInDays("2026-11-01", "2026-11-18")).toBe(17);
    expect(lastDays("2026-11-18", 7)).toEqual({ from: "2026-11-12", to: "2026-11-18" });
    expect(isWithin("2026-11-12", lastDays("2026-11-18", 7))).toBe(true);
    expect(isWithin("2026-11-11", lastDays("2026-11-18", 7))).toBe(false);
    expect(eachDay({ from: "2026-11-30", to: "2026-12-02" })).toEqual(["2026-11-30", "2026-12-01", "2026-12-02"]);
  });

  it("valida datas reais", () => {
    expect(isDateString("2026-11-18")).toBe(true);
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("18/11/2026")).toBe(false);
    expect(isDateString(null)).toBe(false);
  });
});

describe("formatação pt-BR", () => {
  it("formata sem deslocar o dia", () => {
    expect(formatDate("2026-11-18")).toBe("18/11/2026");
    expect(formatDateShort("2026-01-01")).toBe("01/01");
    expect(formatDateLong("2026-11-18")).toBe("quarta-feira, 18 de novembro");
  });
});
