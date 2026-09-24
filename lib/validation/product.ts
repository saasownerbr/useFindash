import { z } from "zod";

export const productStatusValues = ["available", "reserved", "sold"] as const;
export const productTypeValues = ["new", "semi_novo"] as const;

export const PRODUCT_ORIGINS = [
  { value: "wholesaler", label: "Atacadista" },
  { value: "distributor", label: "Distribuidora" },
  { value: "trade_in", label: "Trade-in" },
  { value: "individual", label: "Pessoa física" },
  { value: "other", label: "Outro" },
] as const;

export type ProductOrigin = (typeof PRODUCT_ORIGINS)[number]["value"];
const originValues = PRODUCT_ORIGINS.map((o) => o.value) as [ProductOrigin, ...ProductOrigin[]];

export const productFormSchema = z
  .object({
    type: z.enum(productTypeValues),
    model: z.string().trim().min(2, "Modelo precisa ter pelo menos 2 caracteres."),
    storage: z.string().trim().min(1, "Informe o armazenamento (ex: 128GB)."),
    color: z.string().trim().optional(),
    acquisitionCost: z.coerce.number().positive("Custo de aquisição precisa ser maior que zero."),
    repairCost: z.coerce.number().min(0, "Custo de reparo não pode ser negativo.").default(0),
    origin: z.enum(originValues).or(z.literal("")).optional(),
    purchaseDate: z.string().trim().optional(),
    quantity: z.coerce
      .number()
      .int("Quantidade precisa ser um número inteiro.")
      .min(1, "Quantidade mínima é 1.")
      .default(1),
    imei: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // Seminovos always need the IMEI; a new batch may register it later.
    const imei = data.imei ?? "";
    const required = data.type === "semi_novo";
    if ((required || imei !== "") && !/^\d{15}$/.test(imei)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imei"],
        message: "IMEI precisa ter 15 dígitos numéricos.",
      });
    }
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;
