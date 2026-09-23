import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da loja"),
  logo_url: z
    .string()
    .trim()
    .url("Informe uma URL válida")
    .optional()
    .or(z.literal("")),
  monthly_revenue_goal: z.coerce.number().nonnegative(),
  stock_alert_days: z.coerce.number().int().positive("Deve ser maior que zero"),
  upgrade_alert_months: z.coerce.number().int().positive("Deve ser maior que zero"),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
