import { z } from "zod";

import { normalizeCnpj } from "@/lib/validation/cnpj";

export const onboardingSchema = z.object({
  ownerName: z.string().trim().min(2, "Informe seu nome."),
  storeName: z.string().trim().min(2, "Nome da loja precisa ter pelo menos 2 caracteres."),
  cnpj: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? normalizeCnpj(value) : undefined))
    .refine((value) => value === undefined || value.length === 14, "CNPJ precisa ter 14 dígitos."),
  monthlyRevenueGoal: z.coerce.number().min(0, "A meta não pode ser negativa."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
