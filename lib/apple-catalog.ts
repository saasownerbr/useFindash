// iPhone catalog used by every device entry (estoque, calculadora, venda):
// storage and colors as sold by Apple in Brazil. Newest first.
export interface CatalogModel {
  model: string;
  storage: string[];
  colors: string[];
}

export const APPLE_CATALOG: CatalogModel[] = [
  {
    model: "iPhone 17 Pro Max",
    storage: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Prateado", "Laranja-cósmico", "Azul-intenso"],
  },
  {
    model: "iPhone 17 Pro",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Prateado", "Laranja-cósmico", "Azul-intenso"],
  },
  {
    model: "iPhone Air",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Preto-espacial", "Branco-nuvem", "Dourado-claro", "Azul-céu"],
  },
  {
    model: "iPhone 17",
    storage: ["256GB", "512GB"],
    colors: ["Preto", "Branco", "Azul-névoa", "Sálvia", "Lavanda"],
  },
  {
    model: "iPhone 16e",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco"],
  },
  {
    model: "iPhone 16 Pro Max",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Deserto"],
  },
  {
    model: "iPhone 16 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Deserto"],
  },
  {
    model: "iPhone 16 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco", "Rosa", "Verde-azulado", "Ultramarino"],
  },
  {
    model: "iPhone 16",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Branco", "Rosa", "Verde-azulado", "Ultramarino"],
  },
  {
    model: "iPhone 15 Pro Max",
    storage: ["256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Azul"],
  },
  {
    model: "iPhone 15 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Titânio Preto", "Titânio Branco", "Titânio Natural", "Titânio Azul"],
  },
  {
    model: "iPhone 15 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Verde", "Amarelo", "Rosa", "Azul"],
  },
  {
    model: "iPhone 15",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Preto", "Verde", "Amarelo", "Rosa", "Azul"],
  },
  {
    model: "iPhone 14 Pro Max",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Roxo Profundo", "Dourado", "Prata", "Preto Espacial"],
  },
  {
    model: "iPhone 14 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Roxo Profundo", "Dourado", "Prata", "Preto Espacial"],
  },
  {
    model: "iPhone 14 Plus",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Roxo", "Vermelho", "Azul"],
  },
  {
    model: "iPhone 14",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Roxo", "Vermelho", "Azul"],
  },
  {
    model: "iPhone 13 Pro Max",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Sierra"],
  },
  {
    model: "iPhone 13 Pro",
    storage: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Sierra"],
  },
  {
    model: "iPhone 13",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho", "Azul", "Rosa", "Verde"],
  },
  {
    model: "iPhone 13 Mini",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho", "Azul", "Rosa", "Verde"],
  },
  {
    model: "iPhone 12 Pro Max",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Pacífico"],
  },
  {
    model: "iPhone 12 Pro",
    storage: ["128GB", "256GB", "512GB"],
    colors: ["Grafite", "Dourado", "Prateado", "Azul Pacífico"],
  },
  {
    model: "iPhone 12",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Azul", "Roxo"],
  },
  {
    model: "iPhone 12 Mini",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Azul", "Roxo"],
  },
  {
    model: "iPhone 11 Pro Max",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado", "Verde Meia-Noite"],
  },
  {
    model: "iPhone 11 Pro",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado", "Verde Meia-Noite"],
  },
  {
    model: "iPhone 11",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Vermelho", "Verde", "Amarelo", "Roxo"],
  },
  {
    model: "iPhone XR",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Preto", "Branco", "Azul", "Amarelo", "Coral", "Vermelho"],
  },
  {
    model: "iPhone XS Max",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado"],
  },
  {
    model: "iPhone XS",
    storage: ["64GB", "256GB", "512GB"],
    colors: ["Cinza Espacial", "Prateado", "Dourado"],
  },
  {
    model: "iPhone SE (3ª geração)",
    storage: ["64GB", "128GB", "256GB"],
    colors: ["Meia-Noite", "Estelar", "Vermelho"],
  },
  {
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

/**
 * Instant, offline model search: every word typed must appear in the model name
 * ("13 pro" finds iPhone 13 Pro and 13 Pro Max; "15pm" style shorthand is not guessed).
 */
export function searchModels(query: string, models: string[] = APPLE_CATALOG.map((m) => m.model)) {
  const words = fold(query).replace(/iphone/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return models;
  return models.filter((model) => {
    const name = fold(model);
    const compact = name.replace(/\s+/g, "");
    return words.every((word) => name.includes(word) || compact.includes(word));
  });
}
