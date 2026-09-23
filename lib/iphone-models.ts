// Storage options as sold by Apple for each model.
export const IPHONE_MODELS: { model: string; storage: string[] }[] = [
  { model: "iPhone XR", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone XS", storage: ["64GB", "256GB", "512GB"] },
  { model: "iPhone XS Max", storage: ["64GB", "256GB", "512GB"] },
  { model: "iPhone 11", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone 11 Pro", storage: ["64GB", "256GB", "512GB"] },
  { model: "iPhone 11 Pro Max", storage: ["64GB", "256GB", "512GB"] },
  { model: "iPhone SE (2ª geração)", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone 12 mini", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone 12", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone 12 Pro", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 12 Pro Max", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 13 mini", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 13", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 13 Pro", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone 13 Pro Max", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone SE (3ª geração)", storage: ["64GB", "128GB", "256GB"] },
  { model: "iPhone 14", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 14 Plus", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 14 Pro", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone 14 Pro Max", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone 15", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 15 Plus", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 15 Pro", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone 15 Pro Max", storage: ["256GB", "512GB", "1TB"] },
  { model: "iPhone 16", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 16 Plus", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 16 Pro", storage: ["128GB", "256GB", "512GB", "1TB"] },
  { model: "iPhone 16 Pro Max", storage: ["256GB", "512GB", "1TB"] },
  { model: "iPhone 16e", storage: ["128GB", "256GB", "512GB"] },
  { model: "iPhone 17", storage: ["256GB", "512GB"] },
  { model: "iPhone Air", storage: ["256GB", "512GB", "1TB"] },
  { model: "iPhone 17 Pro", storage: ["256GB", "512GB", "1TB"] },
  { model: "iPhone 17 Pro Max", storage: ["256GB", "512GB", "1TB", "2TB"] },
];

/** Case/space-insensitive key so "iphone 13" and "iPhone 13" or "128 GB" and "128GB" match. */
export function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

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
  const entry = IPHONE_MODELS.find((m) => normalizeKey(m.model) === normalizeKey(model));
  const base = entry?.storage ?? [];
  const known = new Set(base.map(normalizeKey));
  const extras = pricedStorages.filter((s) => !known.has(normalizeKey(s)));
  return [...base, ...extras];
}
