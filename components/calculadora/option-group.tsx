"use client";

import { cn } from "@/lib/utils";

interface OptionGroupProps<K extends string> {
  label: string;
  name: string;
  options: readonly { key: K; label: string; points?: number; note?: string }[];
  value: K | null;
  onChange: (value: K) => void;
  tone?: (key: K) => "danger" | undefined;
}

export function OptionGroup<K extends string>({ label, name, options, value, onChange, tone }: OptionGroupProps<K>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.key;
          const danger = tone?.(option.key) === "danger";
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              name={name}
              aria-checked={selected}
              onClick={() => onChange(option.key)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? danger
                    ? "border-danger bg-danger/10 text-foreground"
                    : "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background/40 text-muted-foreground hover:border-[#3D3D3D] hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selected ? (danger ? "border-danger" : "border-primary") : "border-[#4B5563]"
                  )}
                >
                  {selected && <span className={cn("h-2 w-2 rounded-full", danger ? "bg-danger" : "bg-primary")} />}
                </span>
                {option.label}
              </span>
              {option.points !== undefined && (
                <span className={cn("shrink-0 tabular-nums text-xs", selected ? "text-foreground" : "text-[#6B7280]")}>
                  {option.points} pts
                </span>
              )}
              {option.note && <span className="shrink-0 text-xs text-[#6B7280]">{option.note}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
