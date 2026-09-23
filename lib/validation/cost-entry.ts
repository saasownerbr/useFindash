import { z } from "zod";

export const COST_TYPES = ["fixed", "variable", "marketing", "supplier"] as const;

export const costEntrySchema = z.object({
  type: z.enum(COST_TYPES, { errorMap: () => ({ message: "Selecione o tipo de custo" }) }),
  description: z.string().trim().min(1, "Informe uma descrição"),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  date: z.string().trim().min(1, "Informe a data"),
});

export type CostEntryInput = z.infer<typeof costEntrySchema>;
