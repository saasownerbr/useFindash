import { APPLE_CATALOG, findCatalogModel, normalizeKey } from "@/lib/apple-catalog";

export { normalizeKey };

// Storage options as sold by Apple for each model (see lib/apple-catalog.ts).
export const IPHONE_MODELS: { model: string; storage: string[] }[] = APPLE_CATALOG;

/** Catalog models plus any extra models the store already priced. */
export function modelOptions(extraModels: string[]) {
  const catalog = IPHONE_MODELS.map((m) => m.model);
  const known = new Set(catalog.map(normalizeKey));
  const extras = extraModels.filter((m) => {
    const key = normalizeKey(m);
    if (known.has(key)) return false;
    known.add(key);
    return true;
  });
  return [...catalog, ...extras.sort()];
}

/** Storage options for a model: the catalog's, merged with sizes the store priced. */
export function storageOptions(model: string, pricedStorages: string[]) {
  const base = findCatalogModel(model)?.storage ?? [];
  const known = new Set(base.map(normalizeKey));
  const extras = pricedStorages.filter((s) => !known.has(normalizeKey(s)));
  return [...base, ...extras];
}

/** Colors for a model; empty when the model is not in the catalog. */
export function colorOptions(model: string) {
  return findCatalogModel(model)?.colors ?? [];
}
