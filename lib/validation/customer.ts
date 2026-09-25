import { z } from "zod";

import { requiredPhone } from "@/lib/validation/phone";

export const ACQUISITION_CHANNELS = ["instagram", "whatsapp", "pdv", "referral", "paid_traffic"] as const;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente"),
  whatsapp: requiredPhone,
  birthdate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || new Date(value) <= new Date(), {
      message: "Data de nascimento não pode ser no futuro",
    }),
  acquisition_channel: z.enum(ACQUISITION_CHANNELS, { errorMap: () => ({ message: "Selecione um canal de origem" }) }),
});

export type CustomerInput = z.infer<typeof customerSchema>;
