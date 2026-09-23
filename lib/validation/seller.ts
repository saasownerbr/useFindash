import { z } from "zod";

export const sellerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do vendedor"),
  email: z.string().trim().email("Informe um email válido"),
  role: z.enum(["owner", "admin", "seller"], { errorMap: () => ({ message: "Selecione um papel" }) }),
  commission_rate: z.coerce
    .number()
    .min(0, "A comissão não pode ser negativa")
    .max(1, "Use uma fração de 0 a 1 (ex.: 0.05 para 5%)"),
});

export type SellerInput = z.infer<typeof sellerSchema>;
