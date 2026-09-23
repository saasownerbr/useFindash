import { z } from "zod";

export const ACQUISITION_CHANNELS = ["instagram", "whatsapp", "pdv", "referral", "paid_traffic"] as const;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente"),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe um WhatsApp válido com DDD")
    .regex(/^\d+$/, "Use apenas números, com DDD"),
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
