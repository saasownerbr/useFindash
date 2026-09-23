"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() ?? new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() ?? new Date().getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(selectedYear, month, 1);
    onChange(newDate);
    setSelectedMonth(month);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const handleThisMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    handleMonthSelect(now.getMonth());
  };

  const displayText = value
    ? `${MONTHS[value.getMonth()]} ${value.getFullYear()}`
    : "Selecionar data";

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-border"
      >
        <Calendar className="h-4 w-4" />
        <span>{displayText}</span>
      </Button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground">{selectedYear}</p>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-1">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => handleMonthSelect(index)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  selectedMonth === index
                    ? "bg-primary text-white font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {month}
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClear}
                className="flex-1 text-xs font-medium text-muted-foreground"
              >
                Limpar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleThisMonth}
                className="flex-1 text-xs font-medium text-primary"
              >
                Este mês
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
