import { z } from "zod";

export const priceReferenceSchema = z.object({
  model: z.string().trim().min(1, "Informe o modelo"),
  storage: z.string().trim().min(1, "Informe o armazenamento"),
  base_price: z.coerce.number().positive("O preço base deve ser maior que zero"),
  grade_multiplier_a_plus: z.coerce.number().min(0).max(1),
  grade_multiplier_a: z.coerce.number().min(0).max(1),
  grade_multiplier_b: z.coerce.number().min(0).max(1),
  grade_multiplier_c: z.coerce.number().min(0).max(1),
});

export type PriceReferenceInput = z.infer<typeof priceReferenceSchema>;
