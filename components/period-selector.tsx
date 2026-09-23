"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { usePeriodFilterStore, type PeriodType } from "@/lib/period-filter-store";
import { Calendar, ChevronDown } from "lucide-react";

function formatMonth(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(". de ", "/").replace(" de ", "/");
}

function toMonthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0, 23, 59, 59, 999) };
}

export function PeriodSelector() {
  const { periodType, startDate, endDate, setPeriod } = usePeriodFilterStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>(startDate ? toMonthValue(startDate) : "");
  const [customEnd, setCustomEnd] = useState<string>(endDate ? toMonthValue(endDate) : "");

  const handlePeriodChange = (type: PeriodType) => {
    setPeriod(type);
    setShowDatePicker(false);
  };

  const rangeValid = customStart !== "" && customEnd !== "" && customStart <= customEnd;

  const handleCustomDateApply = () => {
    if (!rangeValid) return;
    setPeriod("custom", monthBounds(customStart).start, monthBounds(customEnd).end);
    setShowDatePicker(false);
  };

  const periodLabels: { [key in PeriodType]: string } = {
    today: "Hoje",
    month: "Este mês",
    "30days": "Últimos 30 dias",
    "90days": "Últimos 90 dias",
    custom: "Personalizado",
  };

  const displayText = periodType === "custom" && startDate && endDate
    ? `${formatMonth(startDate)} – ${formatMonth(endDate)}`
    : periodLabels[periodType];

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="flex items-center gap-2 border border-border"
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        <Calendar className="h-4 w-4" />
        <span>{displayText}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showDatePicker && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="space-y-3">
            {(["today", "month", "30days", "90days"] as const).map((type) => (
              <Button
                key={type}
                variant={periodType === type ? "default" : "secondary"}
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePeriodChange(type)}
              >
                {periodLabels[type]}
              </Button>
            ))}

            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Período personalizado</p>
              <div className="space-y-2">
                <MonthPicker value={customStart} onChange={setCustomStart} placeholder="De" className="w-full" />
                <MonthPicker value={customEnd} onChange={setCustomEnd} placeholder="Até" className="w-full" />
                {customStart && customEnd && !rangeValid && (
                  <p className="text-xs text-danger">O mês final precisa ser igual ou posterior ao inicial.</p>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCustomDateApply}
                  disabled={!rangeValid}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
