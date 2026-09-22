export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCnpjFormat(value: string): boolean {
  return normalizeCnpj(value).length === 14;
}
