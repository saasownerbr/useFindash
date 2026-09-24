"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { usePeriodFilterStore, type PeriodType } from "@/lib/period-filter-store";
import { cn } from "@/lib/utils";

function formatMonth(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(". de ", "/").replace(" de ", "/");
}

function toMonthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0, 23, 59, 59, 999) };
}

const PRESETS: { key: Exclude<PeriodType, "custom">; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "month", label: "Este mês" },
  { key: "30days", label: "30 dias" },
  { key: "90days", label: "90 dias" },
];

const PILL = "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] transition-colors";
const PILL_ACTIVE = "bg-primary font-bold text-primary-foreground";
const PILL_IDLE = "bg-card font-medium text-muted-foreground hover:text-foreground";

/** Period pills for the dashboard: presets plus a custom month range. */
export function PeriodSelector() {
  const { periodType, startDate, endDate, setPeriod } = usePeriodFilterStore();
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>(startDate ? toMonthValue(startDate) : "");
  const [customEnd, setCustomEnd] = useState<string>(endDate ? toMonthValue(endDate) : "");

  const rangeValid = customStart !== "" && customEnd !== "" && customStart <= customEnd;

  function applyCustom() {
    if (!rangeValid) return;
    setPeriod("custom", monthBounds(customStart).start, monthBounds(customEnd).end);
    setCustomOpen(false);
  }

  return (
    <div className="relative max-w-full">
      <div role="group" aria-label="Período" className="flex gap-1.5 overflow-x-auto">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={periodType === p.key}
            onClick={() => {
              setPeriod(p.key);
              setCustomOpen(false);
            }}
            className={cn(PILL, periodType === p.key ? PILL_ACTIVE : PILL_IDLE)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={periodType === "custom"}
          aria-expanded={customOpen}
          onClick={() => setCustomOpen((open) => !open)}
          className={cn(PILL, "inline-flex items-center gap-1.5", periodType === "custom" ? PILL_ACTIVE : PILL_IDLE)}
        >
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          {periodType === "custom" && startDate && endDate
            ? `${formatMonth(startDate)} – ${formatMonth(endDate)}`
            : "Personalizado"}
        </button>
      </div>

      {customOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-medium text-muted-foreground">Período personalizado</p>
          <MonthPicker value={customStart} onChange={setCustomStart} placeholder="De" className="w-full" />
          <MonthPicker value={customEnd} onChange={setCustomEnd} placeholder="Até" className="w-full" />
          {customStart && customEnd && !rangeValid && (
            <p className="text-xs text-danger">O mês final precisa ser igual ou posterior ao inicial.</p>
          )}
          <Button size="sm" className="w-full" onClick={applyCustom} disabled={!rangeValid}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
