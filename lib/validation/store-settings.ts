import { z } from "zod";

// "Minha Loja" card in Configurações.
export const storeProfileSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da loja"),
  monthly_revenue_goal: z.coerce.number().positive("Meta mensal deve ser maior que zero"),
});

export type StoreProfileInput = z.infer<typeof storeProfileSchema>;

// "Alertas Automáticos" card in Configurações.
export const alertSettingsSchema = z.object({
  stock_alert_days: z.coerce.number().int().positive("Deve ser maior que zero"),
  upgrade_alert_months: z.coerce.number().int().positive("Deve ser maior que zero"),
});

export type AlertSettingsInput = z.infer<typeof alertSettingsSchema>;
