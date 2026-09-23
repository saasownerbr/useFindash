"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parse(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : null;
}

function formatLabel(value: string) {
  const parsed = parse(value);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

interface MonthPickerProps {
  id?: string;
  /** "YYYY-MM", or "" when empty */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MonthPicker({ id, value, onChange, placeholder = "Selecionar mês", className }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [viewYear, setViewYear] = useState(selected?.year ?? new Date().getFullYear());

  function handleOpenChange(next: boolean) {
    if (next) setViewYear(parse(value)?.year ?? new Date().getFullYear());
    setOpen(next);
  }

  function select(year: number, month: number) {
    onChange(`${year}-${String(month + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  const label = formatLabel(value);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-10 w-48 items-center justify-between gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-sm text-[#F8F8F8] transition-colors hover:border-[#3D3D3D] focus-visible:border-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/15 data-[state=open]:border-[#3B82F6]",
            className
          )}
        >
          <span className={label ? "first-letter:uppercase" : "text-[#6B7280]"}>{label ?? placeholder}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-[#6B7280]" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Ano anterior"
            onClick={() => setViewYear((y) => y - 1)}
            className="rounded-md p-1 text-[#6B7280] hover:bg-[#2A2A2A] hover:text-[#F8F8F8]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-medium text-[#6B7280]">{viewYear}</span>
          <button
            type="button"
            aria-label="Próximo ano"
            onClick={() => setViewYear((y) => y + 1)}
            className="rounded-md p-1 text-[#6B7280] hover:bg-[#2A2A2A] hover:text-[#F8F8F8]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {MONTHS.map((name, index) => {
            const isSelected = selected?.year === viewYear && selected.month === index;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => select(viewYear, index)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] transition-colors",
                  isSelected
                    ? "bg-[#3B82F6] font-semibold text-white"
                    : "text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-[#F8F8F8]"
                )}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#2A2A2A] pt-3">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-[13px] text-[#6B7280] hover:text-[#9CA3AF]"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(currentMonthValue());
              setOpen(false);
            }}
            className="text-[13px] text-[#3B82F6] hover:text-[#60A5FA]"
          >
            Este mês
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
