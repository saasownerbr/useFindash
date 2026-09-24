import { create } from "zustand";

export type PeriodType = "today" | "month" | "30days" | "90days" | "custom";

interface PeriodFilterState {
  periodType: PeriodType;
  startDate: Date | null;
  endDate: Date | null;
  setPeriod: (type: PeriodType, start?: Date, end?: Date) => void;
}

function getDefaultDateRange(type: PeriodType): { start: Date; end: Date } {
  const end = new Date();
  let start = new Date();

  switch (type) {
    case "today":
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      break;
    case "month":
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
    case "30days":
      start.setDate(end.getDate() - 30);
      break;
    case "90days":
      start.setDate(end.getDate() - 90);
      break;
    case "custom":
      break;
  }

  return { start, end };
}

export const usePeriodFilterStore = create<PeriodFilterState>((set) => {
  // Load from localStorage on init
  const stored = typeof window !== "undefined" ? localStorage.getItem("period_filter") : null;
  const initialState = stored ? JSON.parse(stored) : null;

  const defaultRange = getDefaultDateRange("month");

  // Presets are relative to today, so only a custom range keeps its saved dates;
  // "Este mês" saved in August must mean September when reopened in September.
  const periodType: PeriodType = initialState?.periodType || "month";
  const isCustom = periodType === "custom" && initialState?.startDate && initialState?.endDate;
  const range = isCustom
    ? { start: new Date(initialState.startDate), end: new Date(initialState.endDate) }
    : periodType === "custom"
      ? defaultRange
      : getDefaultDateRange(periodType);

  return {
    periodType: isCustom || periodType !== "custom" ? periodType : "month",
    startDate: range.start,
    endDate: range.end,
    setPeriod: (type: PeriodType, start?: Date, end?: Date) => {
      set((state) => {
        let newStart = start;
        let newEnd = end || new Date();

        if (!start) {
          const range = getDefaultDateRange(type);
          newStart = range.start;
          newEnd = range.end;
        }

        const newState = {
          periodType: type,
          startDate: newStart,
          endDate: newEnd,
        };

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("period_filter", JSON.stringify(newState));
        }

        return newState;
      });
    },
  };
});
