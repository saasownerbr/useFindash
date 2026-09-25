/**
 * Brazilian phone numbers. Fields accept any typing ("11987654321", "11 98765-4321", "+55 (11) 98765-4321");
 * the database keeps only the digits (DDD + number) and screens show them formatted.
 */

/** DDD + number digits, dropping a leading 55 country code. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

/** (XX) X XXXX-XXXX for 11-digit mobiles, (XX) XXXX-XXXX for 10-digit landlines; anything else as typed. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const d = phoneDigits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value.trim();
}
