import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CustomerPhone } from "@/components/ui/customer-phone";

describe("CustomerPhone", () => {
  it("shows the formatted number with a wa.me link that has no message", () => {
    const html = renderToStaticMarkup(<CustomerPhone phone="11987654321" name="Maria" />);
    expect(html).toContain("(11) 9 8765-4321");
    expect(html).toContain('href="https://wa.me/5511987654321"');
    expect(html).not.toContain("text=");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('aria-label="Abrir conversa no WhatsApp com Maria"');
  });

  it("shows no icon when the customer has no number", () => {
    const html = renderToStaticMarkup(<CustomerPhone phone="" name="Maria" />);
    expect(html).not.toContain("wa.me");
  });

  it("shows no icon for a number too short to dial", () => {
    expect(renderToStaticMarkup(<CustomerPhone phone="9876" />)).not.toContain("wa.me");
  });
});
