import { z } from "zod";

import { optionalPhone } from "@/lib/validation/phone";

export const sellerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do vendedor"),
  // Only required when creating (inviting) a seller — the edit form hides
  // this field entirely, so it must validate when left blank.
  email: z.string().trim().email("Informe um email válido").optional().or(z.literal("")),
  phone: optionalPhone,
  role: z.enum(["owner", "admin", "seller"], { errorMap: () => ({ message: "Selecione um papel" }) }),
  commission_rate: z.coerce
    .number()
    .min(0, "A comissão não pode ser negativa")
    .max(1, "Use uma fração de 0 a 1 (ex.: 0.05 para 5%)"),
});

export type SellerInput = z.infer<typeof sellerSchema>;
