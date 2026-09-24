import { z } from "zod";

export const COST_TYPES = ["fixed", "variable", "marketing", "supplier"] as const;

/** Free-text hint per type; the user always writes the description in their own words. */
export const DESCRIPTION_PLACEHOLDERS: Record<(typeof COST_TYPES)[number], string> = {
  fixed: "Ex: Aluguel da loja, internet, contador...",
  variable: "Descreva o que representa este custo...",
  marketing: "Ex: Impulsionamento Instagram, produção de conteúdo... (opcional)",
  supplier: "Ex: Pagamento atacado, reposição de estoque...",
};

export const costEntrySchema = z
  .object({
    type: z.enum(COST_TYPES, { errorMap: () => ({ message: "Selecione o tipo de custo" }) }),
    description: z.string().trim(),
    amount: z.coerce.number().positive("O valor deve ser maior que zero"),
    date: z.string().trim().min(1, "Informe a data"),
  })
  // Marketing entries may go without a description; every other type needs one.
  .refine((data) => data.type === "marketing" || data.description.length > 0, {
    path: ["description"],
    message: "Informe uma descrição",
  });

export type CostEntryInput = z.infer<typeof costEntrySchema>;
