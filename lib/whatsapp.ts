import { phoneDigits } from "@/lib/phone";

/**
 * wa.me (Click to Chat) link for a Brazilian number in any format ("(11) 9 8765-4321", "11987654321",
 * "+55 11 98765-4321", "011 98765-4321"). DDD + number get the 55 country code; null when there is no
 * number to dial. Nothing is sent: the link only opens the chat.
 */
export function whatsappLink(phone: string | null | undefined, message?: string): string | null {
  // phoneDigits drops a leading 55; a leading 0 is the long-distance prefix ("0 11 ...").
  const digits = phoneDigits(phone ?? "").replace(/^0+/, "");
  if (digits.length < 10) return null;
  const full = digits.length <= 11 ? `55${digits}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${full}${query}`;
}
