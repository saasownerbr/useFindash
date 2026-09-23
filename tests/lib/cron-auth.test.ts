import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { verifyCronSecret } from "@/lib/cron-auth";

function makeRequest(header?: string) {
  return new NextRequest("https://example.com/api/cron/x", {
    headers: header ? { authorization: header } : {},
  });
}

describe("verifyCronSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when the header is missing", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest())).toBe(false);
  });

  it("rejects when the header doesn't match", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest("Bearer wrong"))).toBe(false);
  });

  it("rejects when CRON_SECRET is unset, even if a header is sent", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(verifyCronSecret(makeRequest("Bearer anything"))).toBe(false);
  });

  it("accepts a matching bearer header", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest("Bearer s3cret"))).toBe(true);
  });
});
