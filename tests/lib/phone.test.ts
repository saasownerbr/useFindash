import { describe, expect, it } from "vitest";

import { formatPhone, phoneDigits } from "@/lib/phone";

describe("formatPhone", () => {
  it.each([
    ["11987654321", "(11) 9 8765-4321"],
    ["11 98765-4321", "(11) 9 8765-4321"],
    ["(11) 98765 4321", "(11) 9 8765-4321"],
    ["+55 11 98765-4321", "(11) 9 8765-4321"],
  ])("formats the mobile %s", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });

  it("formats a 10-digit landline", () => {
    expect(formatPhone("1133224455")).toBe("(11) 3322-4455");
  });

  it("leaves an incomplete number as typed", () => {
    expect(formatPhone(" 11 9876 ")).toBe("11 9876");
  });

  it("returns an empty string for no value", () => {
    expect(formatPhone(null)).toBe("");
  });
});

describe("phoneDigits", () => {
  it("keeps DDD + number and drops the 55 country code", () => {
    expect(phoneDigits("+55 (11) 9 8765-4321")).toBe("11987654321");
    expect(phoneDigits("(11) 3322-4455")).toBe("1133224455");
  });
});
