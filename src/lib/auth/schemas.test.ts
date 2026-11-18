import { describe, expect, it } from "vitest";

import { loginSchema, resetPasswordSchema } from "./schemas";

describe("loginSchema", () => {
  it("normaliza espaços no e-mail", () => {
    expect(loginSchema.parse({ email: " a@b.com ", password: "x" }).email).toBe("a@b.com");
  });

  it("rejeita e-mail inválido", () => {
    expect(loginSchema.safeParse({ email: "abc", password: "x" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("aceita senha com letras e números", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "senha123", confirmPassword: "senha123" }).success,
    ).toBe(true);
  });

  it.each(["curta1", "somenteletras", "12345678"])("rejeita %j", (password) => {
    expect(
      resetPasswordSchema.safeParse({ password, confirmPassword: password }).success,
    ).toBe(false);
  });

  it("exige confirmação igual", () => {
    const result = resetPasswordSchema.safeParse({
      password: "senha123",
      confirmPassword: "senha124",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
