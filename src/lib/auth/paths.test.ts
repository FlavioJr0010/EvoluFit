import { describe, expect, it } from "vitest";

import { isPublicPath, safeRedirectPath } from "./paths";

describe("safeRedirectPath", () => {
  it("mantém caminhos internos", () => {
    expect(safeRedirectPath("/redefinir-senha")).toBe("/redefinir-senha");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil"])(
    "usa o fallback para %j",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/");
    },
  );
});

describe("isPublicPath", () => {
  it("libera login, recuperação e callbacks de auth", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/esqueci-senha")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
  });

  it("protege o restante, inclusive a redefinição de senha", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/redefinir-senha")).toBe(false);
    expect(isPublicPath("/alimentos")).toBe(false);
  });
});
