"use client";

import { cn } from "@/lib/utils";

/** Segmented control used for page-level tabs (Estoque, Financeiro). Scrolls sideways on narrow screens. */
export function TabBar<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-[12px] bg-[#111111] p-1", className)}
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[8px] px-4 py-2 text-sm transition-colors",
              active
                ? "bg-card font-semibold text-foreground"
                : "bg-transparent font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
