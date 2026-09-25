"use client";

import { MessageCircle } from "lucide-react";

import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Small icon that opens a WhatsApp chat with the number (wa.me Click to Chat) in a new tab or the app.
 * No message is filled in; the seller writes it. Renders nothing when there is no number to dial.
 */
export function WhatsAppIconLink({ phone, name, className }: { phone: string | null | undefined; name?: string; className?: string }) {
  const href = whatsappLink(phone);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name ? `Abrir conversa no WhatsApp com ${name}` : "Abrir conversa no WhatsApp"}
      title="Abrir no WhatsApp"
      // Rows that open the customer on click must not also navigate.
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#25D366] transition-colors hover:bg-[rgba(37,211,102,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
    </a>
  );
}

/** A customer's number, formatted, with the WhatsApp shortcut beside it. */
export function CustomerPhone({ phone, name, className }: { phone: string | null | undefined; name?: string; className?: string }) {
  if (!phone) return <span className={className}>—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{formatPhone(phone)}</span>
      <WhatsAppIconLink phone={phone} name={name} />
    </span>
  );
}
