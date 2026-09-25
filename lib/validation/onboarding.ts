import { z } from "zod";

import { optionalCpfCnpjField } from "@/lib/validation/cnpj";

// The revenue goal is not asked here; it starts at 0 and is set later in Financeiro > Meta.
export const onboardingSchema = z.object({
  ownerName: z.string().trim().min(2, "Informe seu nome."),
  storeName: z.string().trim().min(2, "Nome da loja precisa ter pelo menos 2 caracteres."),
  cnpj: optionalCpfCnpjField,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
