import { describe, expect, it } from "vitest";

import { asaasApiKey, asaasBaseUrl } from "@/lib/asaas";

const PROD = "https://api.asaas.com/v3";
const SANDBOX = "https://sandbox.asaas.com/api/v3";

describe("asaasBaseUrl", () => {
  it("follows the environment written in the key, whatever ASAAS_ENVIRONMENT says", () => {
    expect(asaasBaseUrl("$aact_prod_abc", "sandbox")).toBe(PROD);
    expect(asaasBaseUrl("$aact_hmlg_abc", "production")).toBe(SANDBOX);
  });

  it("falls back to a normalized ASAAS_ENVIRONMENT for keys without a marker", () => {
    expect(asaasBaseUrl("$aact_legacy", " Production\n")).toBe(PROD);
    expect(asaasBaseUrl("$aact_legacy", '"production"')).toBe(PROD);
    expect(asaasBaseUrl("$aact_legacy", "sandbox")).toBe(SANDBOX);
    expect(asaasBaseUrl("$aact_legacy", undefined)).toBe(SANDBOX);
  });
});

describe("asaasApiKey", () => {
  it("strips whitespace and quotes pasted with the key", () => {
    expect(asaasApiKey(' "$aact_prod_abc"\n')).toBe("$aact_prod_abc");
  });
});
