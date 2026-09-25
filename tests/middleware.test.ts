import { describe, it, expect } from "vitest";

import { config } from "@/middleware";

function matches(pathname: string): boolean {
  const pattern = config.matcher[0];
  return new RegExp(`^${pattern}$`.replace(/^\^\//, "^")).test(pathname.replace(/^\//, ""));
}

describe("middleware matcher", () => {
  it("does not intercept cron routes (they auth via CRON_SECRET, not a session)", () => {
    expect(matches("/api/cron/upgrade-alerts")).toBe(false);
    expect(matches("/api/cron/birthday-alerts")).toBe(false);
    expect(matches("/api/cron/update-stock-days")).toBe(false);
  });

  it("does not intercept webhooks (they auth via their own token header)", () => {
    expect(matches("/api/webhooks/asaas")).toBe(false);
  });

  it("still intercepts normal app and other api routes", () => {
    expect(matches("/dashboard")).toBe(true);
    expect(matches("/api/sellers")).toBe(true);
  });
});
