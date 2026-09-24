import { describe, expect, it } from "vitest";

import { APPLE_CATALOG, findCatalogModel, searchModels } from "@/lib/apple-catalog";

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
