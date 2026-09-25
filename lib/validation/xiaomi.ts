import { z } from "zod";

import { PRODUCT_ORIGINS, productTypeValues, type ProductOrigin } from "@/lib/validation/product";

/** Xiaomi entry: free-text model and color, fixed storage options, no IMEI (it is not tracked like Apple's). */
export const XIAOMI_STORAGES = ["64GB", "128GB", "256GB", "512GB"] as const;

const originValues = PRODUCT_ORIGINS.map((o) => o.value) as [ProductOrigin, ...ProductOrigin[]];

export const xiaomiFormSchema = z.object({
  model: z.string().trim().min(2, "Informe o modelo (ex: Redmi Note 13)."),
  storage: z.enum(XIAOMI_STORAGES, { errorMap: () => ({ message: "Selecione o armazenamento." }) }),
  color: z.string().trim().optional(),
  type: z.enum(productTypeValues),
  origin: z.enum(originValues).or(z.literal("")).optional(),
  acquisitionCost: z.coerce.number().positive("Custo de aquisição precisa ser maior que zero."),
  repairCost: z.coerce.number().min(0, "Custo de reparo não pode ser negativo.").default(0),
  quantity: z.coerce
    .number()
    .int("Quantidade precisa ser um número inteiro.")
    .min(1, "Quantidade mínima é 1.")
    .max(500, "Quantidade máxima por lote é 500.")
    .default(1),
  purchaseDate: z.string().trim().optional(),
});

export type XiaomiFormInput = z.infer<typeof xiaomiFormSchema>;
