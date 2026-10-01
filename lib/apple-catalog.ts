// Apple catalog used by every device entry (estoque, calculadora, venda):
// storage and colors as sold by Apple in Brazil. Newest first.
export type CatalogType = "iphone" | "watch" | "mac";

export interface CatalogModel {
  /** Defaults to "iphone". A watch's `storage` holds its case sizes. */
  type?: CatalogType;
  model: string;
  storage: string[];
  colors: string[];
}

export const APPLE_CATALOG: CatalogModel[] = [
  // iPhones 2026
  {
    type: "iphone",
    model: "iPhone 18 Pro Max",
    storage: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Preto", "Prateado", "Glacial", "Bordô"],
  },
  {
    type: "iphone",
    model: "iPhone 18 Pro",
    storage: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Preto", "Prateado", "Glacial", "Bordô"],
  },

  // Apple Watch 2026
  {
    type: "watch",
    model: "Apple Watch Ultra 4",
    storage: ["49mm"],
    colors: ["Titânio natural", "Titânio preto"],
  },
  {
    type: "watch",
    model: "Apple Watch Series 12",
    storage: ["42mm", "46mm"],
    colors: [
      "Bronze-escuro",
      "Preto",
      "Dourado-claro",
      "Cinza-espacial",
      "Ouro-brilhante",
      "Titânio natural",
      "Branco-pérola",
      "Azul-noite",
    ],
  },

  // Mac 2026
  {
    type: "mac",
    model: "Mac Studio M5 Ultra",
    storage: ["1TB", "2TB", "4TB", "8TB", "16TB"],
    colors: ["Prateado"],
  },
  {
    type: "mac",
    model: "Mac Studio M5 Max",
    storage: ["512GB", "1TB", "2TB", "4TB", "8TB"],
    colors: ["Prateado"],
  },
  {
    type: "mac",
    model: "Mac mini M5 Pro",
    storage: ["512GB", "1TB", "2TB", "4TB", "8TB"],
    colors: ["Prateado"],
  },
  {
    type: "mac",
    model: "Mac mini M6",
    storage: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Prateado"],
  },

  // iPhones
  {
    type: "iphone",
    model: "iPhone 17 Pro Max",
    storage: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Prateado", "Laranja-cósmico", "Azul-intenso"],
  },
  {
    type: "iphone",
    model: "iPhone 17 Pro",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Prateado", "Laranja-cósmico", "Azul-intenso"],
  },
  {
    type: "iphone",
    model: "iPhone Air",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Preto-espacial", "Branco-nuvem", "Dourado-claro", "Azul-céu"],
  },
  {
    type: "iphone",
    model: "iPhone 17",
    storage: ["256GB", "512GB"],
    colors: ["Preto", "Branco", "Azul-névoa", "Sálvia", "Lavanda"],
  },
  {
    type: "iphone",
    model: "iPhone 16e",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco"],
  },
  {
    type: "iphone",
    model: "iPhone 16 Pro Max",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Deserto"],
  },
  {
    type: "iphone",
    model: "iPhone 16 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Deserto"],
  },
  {
    type: "iphone",
    model: "iPhone 16 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco", "Rosa", "Verde-azulado", "Ultramarino"],
  },
  {
    type: "iphone",
    model: "iPhone 16",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco", "Rosa", "Verde-azulado", "Ultramarino"],
  },
  {
    type: "iphone",
    model: "iPhone 15 Pro Max",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 15 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 15 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Verde", "Amarelo", "Rosa", "Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 15",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Verde", "Amarelo", "Rosa", "Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 14 Pro Max",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Roxo Profundo", "Dourado", "Prata", "Preto Espacial"],
  },
  {
    type: "iphone",
    model: "iPhone 14 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Roxo Profundo", "Dourado", "Prata", "Preto Espacial"],
  },
  {
    type: "iphone",
    model: "iPhone 14 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Roxo", "Vermelho", "Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 14",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Roxo", "Vermelho", "Azul"],
  },
  {
    type: "iphone",
    model: "iPhone 13 Pro Max",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Sierra"],
  },
  {
    type: "iphone",
    model: "iPhone 13 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Sierra"],
  },
  {
    type: "iphone",
    model: "iPhone 13",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho", "Azul", "Rosa", "Verde"],
  },
  {
    type: "iphone",
    model: "iPhone 13 Mini",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho", "Azul", "Rosa", "Verde"],
  },
  {
    type: "iphone",
    model: "iPhone 12 Pro Max",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Pacífico"],
  },
  {
    type: "iphone",
    model: "iPhone 12 Pro",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Pacífico"],
  },
  {
    type: "iphone",
    model: "iPhone 12",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Azul", "Roxo"],
  },
  {
    type: "iphone",
    model: "iPhone 12 Mini",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Azul", "Roxo"],
  },
  {
    type: "iphone",
    model: "iPhone 11 Pro Max",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado", "Verde Meia-Noite"],
  },
  {
    type: "iphone",
    model: "iPhone 11 Pro",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado", "Verde Meia-Noite"],
  },
  {
    type: "iphone",
    model: "iPhone 11",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Amarelo", "Roxo"],
  },
  {
    type: "iphone",
    model: "iPhone XR",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Azul", "Amarelo", "Coral", "Vermelho"],
  },
  {
    type: "iphone",
    model: "iPhone XS Max",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado"],
  },
  {
    type: "iphone",
    model: "iPhone XS",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado"],
  },
  {
    type: "iphone",
    model: "iPhone SE (3ª geração)",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho"],
  },
  {
    type: "iphone",
    model: "iPhone SE (2ª geração)",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho"],
  },
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Case/space-insensitive key so "iphone 13" and "iPhone 13" or "128 GB" and "128GB" match. */
export function normalizeKey(value: string) {
  return fold(value).replace(/\s+/g, "");
}

export function findCatalogModel(model: string): CatalogModel | undefined {
  const key = normalizeKey(model);
  return APPLE_CATALOG.find((m) => normalizeKey(m.model) === key);
}

/** The catalog type of a model; anything outside the catalog counts as an iPhone, as before the other lines. */
export function catalogType(model: string): CatalogType {
  return findCatalogModel(model)?.type ?? "iphone";
}

/**
 * Instant, offline model search: every word typed must appear in the model name
 * ("13 pro" finds iPhone 13 Pro and 13 Pro Max; "15pm" style shorthand is not guessed).
 * The word "iphone" in the query is ignored for iPhones only, so it never brings up a Watch or a Mac.
 */
export function searchModels(query: string, models: string[] = APPLE_CATALOG.map((m) => m.model)) {
  const typed = fold(query);
  const split = (text: string) => text.split(/\s+/).filter(Boolean);
  const words = split(typed);
  if (words.length === 0) return models;
  const iphoneWords = split(typed.replace(/iphone/g, ""));
  return models.filter((model) => {
    const name = fold(model);
    const compact = name.replace(/\s+/g, "");
    return (catalogType(model) === "iphone" ? iphoneWords : words).every(
      (word) => name.includes(word) || compact.includes(word)
    );
  });
}
