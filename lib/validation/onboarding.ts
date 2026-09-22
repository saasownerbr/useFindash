import { z } from "zod";

export const onboardingSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da loja precisa ter pelo menos 2 caracteres."),
  monthlyRevenueGoal: z.coerce.number().min(0, "A meta não pode ser negativa."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
