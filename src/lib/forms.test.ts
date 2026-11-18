import { describe, expect, it } from "vitest";

import { formString } from "./forms";

describe("formString", () => {
  it("retorna o texto do campo", () => {
    const fd = new FormData();
    fd.append("email", "a@b.com");
    expect(formString(fd, "email")).toBe("a@b.com");
  });

  it("converte campo ausente ou arquivo em string vazia", () => {
    const fd = new FormData();
    fd.append("arquivo", new Blob(["x"]), "x.txt");
    expect(formString(fd, "email")).toBe("");
    expect(formString(fd, "arquivo")).toBe("");
  });
});
