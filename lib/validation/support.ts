import { z } from "zod";

import { requiredPhone } from "@/lib/validation/phone";

export const SUPPORT_MESSAGE_MAX = 500;

export const supportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Descreva o problema com mais detalhes")
    .max(SUPPORT_MESSAGE_MAX, `Máximo de ${SUPPORT_MESSAGE_MAX} caracteres`),
  whatsapp: requiredPhone,
});

export type SupportInput = z.input<typeof supportSchema>;
