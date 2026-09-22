import { z } from "zod";

export const productStatusValues = ["available", "reserved", "sold"] as const;
export const productTypeValues = ["new", "semi_novo"] as const;

export const productFormSchema = z
  .object({
    type: z.enum(productTypeValues),
    model: z.string().trim().min(2, "Modelo precisa ter pelo menos 2 caracteres."),
    storage: z.string().trim().min(1, "Informe o armazenamento (ex: 128GB)."),
    color: z.string().trim().optional(),
    acquisitionCost: z.coerce.number().positive("Custo de aquisição precisa ser maior que zero."),
    repairCost: z.coerce.number().min(0, "Custo de reparo não pode ser negativo.").default(0),
    supplier: z.string().trim().optional(),
    purchaseDate: z.string().trim().optional(),
    quantity: z.coerce
      .number()
      .int("Quantidade precisa ser um número inteiro.")
      .min(1, "Quantidade mínima é 1.")
      .default(1),
    imei: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "semi_novo" && !/^\d{15}$/.test(data.imei ?? "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imei"],
        message: "IMEI precisa ter 15 dígitos numéricos.",
      });
    }
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;
