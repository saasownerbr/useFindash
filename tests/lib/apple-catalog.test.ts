import { describe, expect, it } from "vitest";

import { APPLE_CATALOG, catalogType, findCatalogModel, searchModels } from "@/lib/apple-catalog";

describe("searchModels", () => {
  it("returns the whole catalog for an empty query", () => {
    expect(searchModels("")).toHaveLength(APPLE_CATALOG.length);
  });

  it("matches every typed word, ignoring case and the word iPhone", () => {
    expect(searchModels("iphone 13 pro")).toEqual(["iPhone 13 Pro Max", "iPhone 13 Pro"]);
    expect(searchModels("PRO MAX 15")).toEqual(["iPhone 15 Pro Max"]);
  });

  it("matches words typed without spaces", () => {
    expect(searchModels("16pro")).toEqual(["iPhone 16 Pro Max", "iPhone 16 Pro"]);
  });

  it("ignores accents", () => {
    expect(searchModels("geracao")).toEqual(["iPhone SE (3ª geração)", "iPhone SE (2ª geração)"]);
  });

  it("searches extra models the store priced", () => {
    expect(searchModels("galaxy", ["Galaxy S24", "iPhone 15"])).toEqual(["Galaxy S24"]);
  });

  it("ignores the word iPhone for iPhones only, so it never lists a Watch or a Mac", () => {
    const iphones = APPLE_CATALOG.filter((m) => m.type === "iphone").map((m) => m.model);
    expect(searchModels("iphone")).toEqual(iphones);
    expect(searchModels("iphone ultra")).toEqual([]);
  });

  it("finds Watch and Mac models by their own names", () => {
    expect(searchModels("watch")).toEqual(["Apple Watch Ultra 4", "Apple Watch Series 12"]);
    expect(searchModels("mac mini")).toEqual(["Mac mini M5 Pro", "Mac mini M6"]);
  });
});

describe("APPLE_CATALOG", () => {
  it("lists the newest line first and gives every entry a type", () => {
    expect(APPLE_CATALOG[0].model).toBe("iPhone 18 Pro Max");
    expect(APPLE_CATALOG.every((m) => m.type)).toBe(true);
    expect(catalogType("Apple Watch Series 12")).toBe("watch");
    expect(catalogType("Mac Studio M5 Ultra")).toBe("mac");
    expect(catalogType("iPhone 13")).toBe("iphone");
    // Outside the catalog (older records, other brands): treated as an iPhone, as before.
    expect(catalogType("Galaxy S24")).toBe("iphone");
  });
});

describe("findCatalogModel", () => {
  it("finds a model regardless of case and spacing", () => {
    expect(findCatalogModel("iphone 12 mini")?.storage).toEqual(["64GB", "128GB", "256GB"]);
    expect(findCatalogModel("iPhone 14")?.colors).toContain("Meia-Noite");
  });

  it("returns undefined for a model outside the catalog", () => {
    expect(findCatalogModel("Galaxy S24")).toBeUndefined();
  });
});
