"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePeriodFilterStore, type PeriodType } from "@/lib/period-filter-store";
import { Calendar, ChevronDown } from "lucide-react";

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function PeriodSelector() {
  const { periodType, startDate, endDate, setPeriod } = usePeriodFilterStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>(startDate ? toISODate(startDate) : "");
  const [customEnd, setCustomEnd] = useState<string>(endDate ? toISODate(endDate) : "");

  const handlePeriodChange = (type: PeriodType) => {
    setPeriod(type);
    setShowDatePicker(false);
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      setPeriod("custom", new Date(customStart), new Date(customEnd));
      setShowDatePicker(false);
    }
  };

  const periodLabels: { [key in PeriodType]: string } = {
    today: "Hoje",
    month: "Este mês",
    "30days": "Últimos 30 dias",
    "90days": "Últimos 90 dias",
    custom: "Personalizado",
  };

  const displayText = periodType === "custom" && startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
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
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCustomDateApply}
                  disabled={!customStart || !customEnd}
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
