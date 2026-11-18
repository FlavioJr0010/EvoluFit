import { describe, expect, it } from "vitest";
import { z } from "zod";

import { decimalPtBR, optionalDecimalPtBR, parseDecimalPtBR } from "./decimal";

describe("parseDecimalPtBR", () => {
  it.each([
    ["8,2", 8.2],
    ["8.2", 8.2],
    ["120", 120],
    [" 0,9 ", 0.9],
    ["1.234,5", 1234.5],
    ["1.234.567", 1234567],
    ["-3,5", -3.5],
    ["0", 0],
  ])("converte %j em %d", (input, expected) => {
    expect(parseDecimalPtBR(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "1,2,3", "1e5", "8,", ",5", "1.23,4", "NaN", "Infinity"])(
    "rejeita %j",
    (input) => {
      expect(parseDecimalPtBR(input)).toBeNull();
    },
  );
});

describe("decimalPtBR", () => {
  const schema = decimalPtBR().pipe(z.number().min(0, "Não pode ser negativo."));

  it("aceita vírgula e valida o número resultante", () => {
    expect(schema.parse("34,5")).toBe(34.5);
  });

  it("rejeita texto inválido com mensagem em português", () => {
    const result = schema.safeParse("dez");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/número válido/);
  });

  it("aplica as regras numéricas após a conversão", () => {
    const result = schema.safeParse("-1");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Não pode ser negativo.");
  });

  it("rejeita vazio quando obrigatório", () => {
    expect(schema.safeParse("").success).toBe(false);
  });
});

describe("optionalDecimalPtBR", () => {
  const schema = optionalDecimalPtBR();

  it("trata vazio como null (não cadastrado), diferente de zero", () => {
    expect(schema.parse("")).toBeNull();
    expect(schema.parse(null)).toBeNull();
    expect(schema.parse(undefined)).toBeNull();
    expect(schema.parse("0")).toBe(0);
  });

  it("converte valores preenchidos", () => {
    expect(schema.parse("0,9")).toBe(0.9);
  });

  it("rejeita valores inválidos", () => {
    expect(schema.safeParse("x").success).toBe(false);
  });
});
