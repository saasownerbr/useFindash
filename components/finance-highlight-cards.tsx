import { formatCurrencyBRL } from "@/lib/finance";
import { cn } from "@/lib/utils";

// Big numbers: 28px from md up, a notch smaller on phones so R$ values fit two per row.
const VALUE = "mt-1 text-[22px] font-bold leading-tight tabular-nums md:text-[28px]";

/** Revenue: neutral card, green figure. */
export function RevenueCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className={cn(VALUE, "text-[#10B981]")}>{formatCurrencyBRL(value)}</p>
    </div>
  );
}

const NET_MARGIN_TONES = {
  positive: { card: "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)]", text: "text-[#10B981]" },
  negative: { card: "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)]", text: "text-[#EF4444]" },
  zero: { card: "border-[#2A2A2A] bg-[#1A1A1A]", text: "text-[#6B7280]" },
};

/** Net margin: the whole card turns green when positive, red when negative. */
export function NetMarginCard({ value }: { value: number }) {
  const tone = NET_MARGIN_TONES[value > 0 ? "positive" : value < 0 ? "negative" : "zero"];
  return (
    <div className={cn("rounded-xl border p-4", tone.card)}>
      <p className={cn("text-xs font-medium", tone.text)}>Margem líquida</p>
      <p className={cn(VALUE, tone.text)}>{formatCurrencyBRL(value)}</p>
    </div>
  );
}
