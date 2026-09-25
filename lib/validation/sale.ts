import { z } from "zod";

export const SALE_CHANNELS = ["instagram", "whatsapp", "pdv", "referral", "paid_traffic"] as const;

export const saleSchema = z
  .object({
    customer_id: z.string().uuid({ message: "Selecione um cliente" }),
    seller_id: z.string().uuid({ message: "Selecione um vendedor" }),
    product_id: z.string().uuid().nullable(),
    sale_channel: z.enum(SALE_CHANNELS, { errorMap: () => ({ message: "Selecione um canal de origem" }) }),
    // Device leg only; 0 in an accessory-only sale. The whole sale must still be worth something (below).
    sale_price: z.coerce
      .number({ invalid_type_error: "Informe o valor da venda" })
      .nonnegative("O valor da venda não pode ser negativo"),
    payment_method: z.string().trim().min(1, "Informe a forma de pagamento"),
    installments: z.coerce.number().int().min(1).default(1),
    accessories: z
      .array(
        z.object({
          accessory_id: z.string().uuid(),
          quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
          unit_price: z.coerce.number().nonnegative(),
        })
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.product_id && data.accessories.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A venda precisa ter um aparelho ou pelo menos um acessório",
        path: ["product_id"],
      });
    }
    const total = data.sale_price + data.accessories.reduce((sum, a) => sum + a.quantity * a.unit_price, 0);
    if (total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O valor da venda deve ser maior que zero",
        path: ["sale_price"],
      });
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;
