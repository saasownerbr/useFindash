import { z } from "zod";

export const accessorySchema = z.object({
  name: z.string().trim().min(2, "Nome precisa ter pelo menos 2 caracteres."),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().int("Quantidade precisa ser um número inteiro.").min(0, "Quantidade não pode ser negativa."),
  cost: z.coerce.number().min(0, "Custo não pode ser negativo."),
  salePrice: z.coerce.number().min(0, "Preço de venda não pode ser negativo."),
});

export type AccessoryInput = z.infer<typeof accessorySchema>;
