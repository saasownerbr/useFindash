import { describe, expect, it } from "vitest";

import { IPHONE_MODELS, modelOptions } from "@/lib/iphone-models";

describe("iPhone model options", () => {
  it("leaves Watch and Mac models out of the calculator, price reference and repair costs", () => {
    const names = IPHONE_MODELS.map((m) => m.model);
    expect(names).toContain("iPhone 18 Pro Max");
    expect(names).not.toContain("Apple Watch Ultra 4");
    expect(names).not.toContain("Mac mini M6");
    expect(modelOptions([])).toEqual(names);
  });

  it("still adds models the store priced itself", () => {
    expect(modelOptions(["Galaxy S24", "iphone 13"])).toEqual([...IPHONE_MODELS.map((m) => m.model), "Galaxy S24"]);
  });
});
