/**
 * wa.me link for a Brazilian number as typed in the store ("(11) 98765-4321").
 * Adds the 55 country code when the number has only DDD + phone.
 */
export function whatsappLink(phone: string, message?: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length <= 11 ? `55${digits}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${full}${query}`;
}
