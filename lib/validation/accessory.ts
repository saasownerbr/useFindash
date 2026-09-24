import { z } from "zod";

/** Accessory categories an iPhone store actually stocks. */
export const ACCESSORY_CATEGORIES = [
  "Capinha",
  "Película de vidro",
  "Película de privacidade",
  "Carregador original",
  "Carregador compatível",
  "Cabo USB-C",
  "Cabo Lightning",
  "Adaptador",
  "AirPods",
  "Fone com fio",
  "Suporte veicular",
  "Suporte de mesa",
  "Bateria externa",
  "Capa MagSafe",
  "Acessório MagSafe",
  "Limpeza e manutenção",
  "Outro",
] as const;

export const accessorySchema = z.object({
  name: z.string().trim().min(2, "Nome precisa ter pelo menos 2 caracteres."),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().int("Quantidade precisa ser um número inteiro.").min(0, "Quantidade não pode ser negativa."),
  cost: z.coerce.number().min(0, "Custo não pode ser negativo."),
  salePrice: z.coerce.number().min(0, "Preço de venda não pode ser negativo."),
});

export type AccessoryInput = z.infer<typeof accessorySchema>;
