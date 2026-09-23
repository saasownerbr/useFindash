import { describe, it, expect } from "vitest";

import { escapeOrFilterValue } from "@/lib/supabase/filters";

describe("escapeOrFilterValue", () => {
  it("escapes commas so they cannot inject an extra .or() clause", () => {
    expect(escapeOrFilterValue("Silva, João")).toBe("Silva\\, João");
  });
  it("escapes parentheses", () => {
    expect(escapeOrFilterValue("a(b)c")).toBe("a\\(b\\)c");
  });
  it("leaves plain text untouched", () => {
    expect(escapeOrFilterValue("Maria Silva")).toBe("Maria Silva");
  });
});
