import { describe, expect, it } from "vitest";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";

describe("isActiveRoute", () => {
  it("matches an exact path", () => {
    expect(isActiveRoute("/estoque", "/estoque")).toBe(true);
  });

  it("matches a nested path", () => {
    expect(isActiveRoute("/estoque/checkup/123", "/estoque")).toBe(true);
  });

  it("does not match an unrelated path", () => {
    expect(isActiveRoute("/clientes", "/estoque")).toBe(false);
  });

  it("does not match a path that merely starts with the same letters", () => {
    expect(isActiveRoute("/estoquex", "/estoque")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("groups the price table and calculator under Inputs", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(hrefs).toContain("/inputs");
    expect(hrefs).not.toContain("/calculadora");
  });
});
