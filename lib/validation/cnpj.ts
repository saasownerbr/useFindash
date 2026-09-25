import { z } from "zod";

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCnpjFormat(value: string): boolean {
  return normalizeCnpj(value).length === 14;
}

function allSameDigit(digits: string) {
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  const d = normalizeCnpj(value);
  if (d.length !== 11 || allSameDigit(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

export function isValidCnpj(value: string): boolean {
  const d = normalizeCnpj(value);
  if (d.length !== 14 || allSameDigit(d)) return false;
  const check = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(d[12]) && check(13) === Number(d[13]);
}

/** A CPF (11 digits) or CNPJ (14 digits) with valid check digits, which Asaas requires to bill. */
export function isValidCpfCnpj(value: string): boolean {
  return isValidCpf(value) || isValidCnpj(value);
}

export function formatCpfCnpj(value: string | null | undefined): string {
  const d = normalizeCnpj(value ?? "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value ?? "";
}

/** Optional CPF or CNPJ form field: blank becomes undefined, anything else must be valid; stored as digits. */
export const optionalCpfCnpjField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? normalizeCnpj(value) : undefined))
  .refine((value) => value === undefined || isValidCpfCnpj(value), "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
