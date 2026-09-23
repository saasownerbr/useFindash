import { z } from "zod";

export const monthlyInputSchema = z.object({
  month: z.string().trim().min(1, "Selecione o mês"),
  paid_traffic_investment: z.coerce.number().nonnegative().default(0),
  leads_instagram: z.coerce.number().int().nonnegative().default(0),
  leads_whatsapp: z.coerce.number().int().nonnegative().default(0),
  leads_pdv: z.coerce.number().int().nonnegative().default(0),
  leads_referral: z.coerce.number().int().nonnegative().default(0),
});

export type MonthlyInputInput = z.infer<typeof monthlyInputSchema>;
